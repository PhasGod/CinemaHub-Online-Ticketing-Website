import { test } from "node:test"
import assert from "node:assert/strict"
import { csrfProtection, createAuthLimiter } from "../src/middleware/security.js"
import { parsePagination } from "../src/utils/pagination.js"
function run(middleware: any, method = "POST", headers: Record<string,string> = {}) {
  let status = 200, passed = false
  const req: any = { method, ip: "test", socket: {}, get: (key: string) => headers[key] }
  const res: any = { status: (code: number) => { status = code; return res }, json: () => res, setHeader: () => {} }
  middleware(req, res, () => { passed = true })
  return { status, passed }
}
test("CSRF rejects missing header and foreign origin", () => {
 const guard = csrfProtection(["http://localhost:8443"])
 assert.equal(run(guard).status,403)
 assert.equal(run(guard,"POST",{"X-CinemaHub-Request":"1",Origin:"https://evil.example"}).status,403)
 assert.equal(run(guard,"POST",{"X-CinemaHub-Request":"1",Origin:"http://localhost:8443"}).passed,true)
 assert.equal(run(guard,"GET").passed,true)
})
test("auth limiter blocks repeated requests", () => {
 const limiter = createAuthLimiter(2)
 assert.equal(run(limiter).passed,true)
 assert.equal(run(limiter).passed,true)
 assert.equal(run(limiter).status,429)
})
test("pagination accepts valid values and rejects malformed values", () => {
 assert.deepEqual(parsePagination("2","12"),{page:2,limit:12,skip:12})
 for (const value of ["abc","0","-1","1.2",["1"]]) assert.throws(()=>parsePagination(value,"12"))
 assert.throws(()=>parsePagination("1","101"))
})
