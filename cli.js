
import 'dotenv/config';

import { Command } from "commander";
import inquirer from "inquirer";
import { handlePrompt } from "./app.js";
import { addVectorEmbeddings } from "./data.js";
import { initializeOso } from "./authz.js";

async function initialize(){
  await addVectorEmbeddings();
  await initializeOso();
}

async function askQuestionsAndRespond(user){
  const questionPrompt = {
     type: 'input',
     name: 'question',
     message: 'What would you like to ask?',
  };

  const question = await inquirer.prompt(questionPrompt)
    .then(response => response.question);

  if ( question.toLowerCase() === 'exit' ){
    return;
  }

  await handlePrompt(user, question);
  await askQuestionsAndRespond(user);
}

// Step 1: identify the user and listen for questions
async function start(){
  const userPrompt = {
    type: 'input',
    name: 'username',
    message: 'Who are you?',
  }

  const user = await inquirer.prompt(userPrompt)
    .then(response => response.username);

  await askQuestionsAndRespond(user.toLowerCase());

  console.log('Thank you for chatting.');
}

// This is the main app
// It defines the CLI that the user interacts with
const cli = new Command();

cli
  .name('oso-rag-chatbot')
  .description('Demo app to illustrate authorizing RAG chatbot responses with Oso Cloud.')
  .version('0.0.1');

cli
  .command('start')
  .description('Start the chatbot')
  .action(() => start());

cli
  .command('initialize')
  .description('Initialize the database and Oso Cloud environment')
  .action(() => initialize());

cli.parseAsync();