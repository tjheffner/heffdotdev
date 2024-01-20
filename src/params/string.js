// test that a route doesn't end in .xml
// so [slug] can greedy match everything except .xml routes
export function match(value) {
    return /^(?!.*[.]xml$).*$/.test(value)
}
