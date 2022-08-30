import dotenv from 'dotenv'
dotenv.config()
export const TELEGRAM = {
    token: process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT
}

export const NOTION = {
    token: process.env.NOTION_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID,
    fields: {
        updatedAt: "Atualizado em",
        archived: "Arquivado",
        url: "Link",
        price: "Preço",
        initialPrice: "Preço inicial",
        name: "Nome",
        location: "Lugar",
        size: "Planta",
        floor: "Andar",
        seller: "Vendedor",
        isAvailable: "Disponível",
        tendency: "Alteração no preço"
    }
}

export const GOOGLE_DRIVE = {
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
}