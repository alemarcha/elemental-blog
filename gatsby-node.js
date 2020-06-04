const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)

exports.onCreateNode = ({ node, getNode, actions }) => {
    const { createNodeField } = actions
    if (node.internal.type === `Mdx`) {
        const slug = createFilePath({ node, getNode })
        const sourceName = getNode(node.parent).sourceInstanceName
        const prefix = sourceName === "basepages" ? "" : "/" + sourceName

        createNodeField({
            node,
            name: `slug`,
            value: `${prefix}${slug}`,
        })
        createNodeField({
            node,
            name: `sourceName`,
            value: sourceName,
        })
    }

    // Esto nos sirve para que al guardar el md desde netlify y compilarlo, pongamos los fields del md image y banner de forma relativa en vez absoluta
    const { frontmatter } = node
    if (frontmatter) {
        const { image, banner } = frontmatter
        if (image) {
            if (image.indexOf("/assets") === 0) {
                console.log("image")
                console.log(image)
                frontmatter.image = path.relative(
                    path.dirname(node.fileAbsolutePath),
                    path.join(__dirname, "/contents/blog/", image)
                )
                console.log(frontmatter.image)
            }
        }
        if (banner) {
            if (banner.indexOf("/assets") === 0) {
                console.log("banner")
                console.log(banner)
                frontmatter.banner = path.relative(
                    path.dirname(node.fileAbsolutePath),
                    path.join(__dirname, "/contents/blog/", banner)
                )
                console.log(frontmatter.banner)
            }
        }
    }
}

exports.createPages = ({ graphql, actions }) => {
    const { createPage } = actions

    return graphql(`
        {
            all: allMdx {
                edges {
                    node {
                        fields {
                            slug
                            sourceName
                        }
                    }
                }
            }
            blog: allMdx(filter: { fields: { sourceName: { eq: "blog" } } }) {
                edges {
                    node {
                        id
                    }
                }
            }
            portfolio: allMdx(
                filter: { fields: { sourceName: { eq: "portfolio" } } }
            ) {
                edges {
                    node {
                        id
                    }
                }
            }
            limitPost: site {
                siteMetadata {
                    blogItemsPerPage
                    portfolioItemsPerPage
                }
            }
        }
    `).then(result => {
        result.data.all.edges.forEach(({ node }) => {
            let template = node.fields.sourceName
            createPage({
                path: node.fields.slug,
                component: path.resolve("./src/templates/" + template + ".js"),
                context: {
                    slug: node.fields.slug,
                },
            })
        })

        const blogPosts = result.data.blog.edges
        const blogPostsPerPage =
            result.data.limitPost.siteMetadata.blogItemsPerPage
        const numBlogPages = Math.ceil(blogPosts.length / blogPostsPerPage)

        Array.from({ length: numBlogPages }).forEach((_, i) => {
            createPage({
                path: i === 0 ? `/blog` : `/blog/${i + 1}`,
                component: path.resolve("./src/templates/blog-list.js"),
                context: {
                    limit: blogPostsPerPage,
                    skip: i * blogPostsPerPage,
                    numPages: numBlogPages,
                    currentPage: i + 1,
                },
            })
        })

        const portfolioItems = result.data.portfolio.edges
        const portfolioItemsPerPage =
            result.data.limitPost.siteMetadata.portfolioItemsPerPage
        const numPortfolioItems = Math.ceil(
            portfolioItems.length / portfolioItemsPerPage
        )

        Array.from({ length: numPortfolioItems }).forEach((_, i) => {
            createPage({
                path: i === 0 ? `/portfolio` : `/portfolio/${i + 1}`,
                component: path.resolve("./src/templates/portfolio-list.js"),
                context: {
                    limit: portfolioItemsPerPage,
                    skip: i * portfolioItemsPerPage,
                    numPages: numPortfolioItems,
                    currentPage: i + 1,
                },
            })
        })
    })
}
