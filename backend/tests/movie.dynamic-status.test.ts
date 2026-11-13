import assert from "node:assert/strict"
import { test } from "node:test"
import { getDynamicMovieStatus, DURATION_5_WEEKS_MS } from "../src/controllers/movie.controller.js"

test("DYNAMIC-STATUS: calculates UPCOMING when now < releaseDate", () => {
  const now = new Date("2026-11-12T12:00:00.000Z")
  const futureRelease = new Date("2026-11-20T00:00:00.000Z")

  const status = getDynamicMovieStatus(futureRelease, "showing", now)
  assert.equal(status, "UPCOMING")
})

test("DYNAMIC-STATUS: calculates NOW_SHOWING when releaseDate <= now <= releaseDate + 35 days", () => {
  const now = new Date("2026-11-12T12:00:00.000Z")

  // 1. Released on the same day
  const todayRelease = new Date("2026-11-12T00:00:00.000Z")
  assert.equal(getDynamicMovieStatus(todayRelease, "coming_soon", now), "NOW_SHOWING")

  // 2. Released 10 days ago
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  assert.equal(getDynamicMovieStatus(tenDaysAgo, "coming_soon", now), "NOW_SHOWING")

  // 3. Exactly 35 days boundary
  const thirtyFiveDaysAgo = new Date(now.getTime() - DURATION_5_WEEKS_MS)
  assert.equal(getDynamicMovieStatus(thirtyFiveDaysAgo, "ended", now), "NOW_SHOWING")
})

test("DYNAMIC-STATUS: calculates ENDED when now > releaseDate + 35 days", () => {
  const now = new Date("2026-11-12T12:00:00.000Z")

  // 36 days ago
  const thirtySixDaysAgo = new Date(now.getTime() - 36 * 24 * 60 * 60 * 1000)
  assert.equal(getDynamicMovieStatus(thirtySixDaysAgo, "showing", now), "ENDED")

  // 50 days ago
  const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000)
  assert.equal(getDynamicMovieStatus(fiftyDaysAgo, "showing", now), "ENDED")
})

test("DYNAMIC-STATUS: handles null or invalid releaseDate via fallbackStatus", () => {
  assert.equal(getDynamicMovieStatus(null, "coming_soon"), "UPCOMING")
  assert.equal(getDynamicMovieStatus(null, "ended"), "ENDED")
  assert.equal(getDynamicMovieStatus(null, "showing"), "NOW_SHOWING")
  assert.equal(getDynamicMovieStatus(undefined, undefined), "NOW_SHOWING")
  assert.equal(getDynamicMovieStatus("invalid-date", "coming_soon"), "UPCOMING")
})
