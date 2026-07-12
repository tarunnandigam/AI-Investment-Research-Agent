const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'agent', 'nodes');

fs.readdirSync(p).forEach(f => {
  if (!f.endsWith('.js')) return;
  let c = fs.readFileSync(path.join(p, f), 'utf8');
  
  if (f === 'test.js') {
    c = c.replace(/import \{ ChatGroq \} from ["']@langchain\/groq["'];\nimport dotenv from ["']dotenv["'];\n\ndotenv\.config\(\);\n\nconst llm = new ChatGroq\(\{[\s\S]*?\}\);/g, 'import { getLLM } from "../llm.js";\nconst llm = getLLM();');
    c = c.replace(/import dotenv from ["']dotenv["'];\n\ndotenv\.config\(\);\n/, '');
  } else {
    c = c.replace(/import \{ ChatGroq \} from '@langchain\/groq';/g, 'import { getLLM } from \'../llm.js\';');
    c = c.replace(/const getLLM = \(\) => new ChatGroq\(\{[\s\S]*?\}\);/g, '');
    c = c.replace(/console\.log\(process\.env\.OPENAI_API_KEY\);\n/g, '');
  }
  
  // Clean up extra blank lines
  c = c.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(path.join(p, f), c);
});
