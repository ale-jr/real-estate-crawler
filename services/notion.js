import { NOTION } from "../constants.js"
import { Client } from "@notionhq/client"

const notion = new Client({
    auth: NOTION.token
})

export const getDatabaseResults = (lastResults = [], startCursor) => {
    return notion.databases.query({
        database_id: NOTION.databaseId,
        page_size: 100,
        start_cursor: startCursor
    }).then((response) => {
        const allResults = [...lastResults, ...response.results]
        if (response.has_more) return getDatabaseResults(allResults, response.next_cursor)
        return allResults
    })
}


export const updateDatabaseProperties = ({ pageId, properties }) => {
    return notion.pages.update({
        page_id: pageId,
        properties
    })
}

export const appendChildrenToPage = (pageId, children) => {
    return notion.blocks.children.append({
        block_id: pageId,
        children
    })
}