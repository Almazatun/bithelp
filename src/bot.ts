import { Telegraf } from "telegraf";
import { configs } from "./config";

export const bot = new Telegraf(configs.bot.apiKey!);
