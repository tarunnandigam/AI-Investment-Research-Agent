import { getLLM } from "../llm.js";
import dotenv from "dotenv";

dotenv.config();

const llm = getLLM();

const response = await llm.invoke("Hello");
console.log(response.content);