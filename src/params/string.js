// match anything that doesn't end in .xml, so [slug] can greedy match
// everything except the .xml routes
export function match(value) {
  return /^(?!.*[.]xml$).*$/.test(value)
}
