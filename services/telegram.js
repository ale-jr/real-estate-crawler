import { TELEGRAM } from '../constants.js'
import TelegramBot from 'node-telegram-bot-api'

const bot = new TelegramBot(TELEGRAM.token, {
    polling: false
})

export const sentFormattedMessage = (message) => {
    return bot.sendMessage(TELEGRAM.chatId, message, { parse_mode: "MarkdownV2", disable_web_page_preview: true })
}