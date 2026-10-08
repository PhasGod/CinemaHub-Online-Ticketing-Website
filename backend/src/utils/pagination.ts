export function parsePagination(
    pageInput: unknown,
    limitInput: unknown,
    defaultLimit = 10,
) {
    function readInteger(
        input: unknown,
        fallback: number,
        max: number,
        label: string,
    ) {
        if (input === undefined) return fallback

        if (typeof input !== "string" || !/^[1-9]\d*$/.test(input)) {
            throw new Error(`${label} phải là số nguyên dương`)
        }

        const value = Number(input)

        if (!Number.isSafeInteger(value) || value > max) {
            throw new Error(`${label} không được vượt quá ${max}`)
        }

        return value
    }

    const page = readInteger(pageInput, 1, 100000, "Số trang")
    const limit = readInteger(limitInput, defaultLimit, 100, "Số bản ghi")

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    }
}