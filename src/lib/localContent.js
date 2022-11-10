export const fetchMarkdownPosts = async () => {
  const allPostFiles = import.meta.glob('/src/content/work/*.svx')
  const iterablePostFiles = Object.entries(allPostFiles)

  const allPosts = await Promise.all(
    iterablePostFiles.map(async ([path, resolver]) => {
      const { metadata } = await resolver()
      const postPath = path.slice(17, -4)

      const { name, url, slug, description, type, date } = metadata

      return {
        name,
        url,
        slug,
        description,
        type,
        date,
        path: postPath,
      }
    })
  )

  return allPosts
}
