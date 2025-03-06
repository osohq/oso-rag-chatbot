import { Command } from "commander";
import inquirer from "inquirer";

async function askQuestionsAndRespond(user, callback){
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

  await callback(user, question);
  await askQuestionsAndRespond(user, callback);
}

async function startCommand(callback){
  const userPrompt = {
    type: 'input',
    name: 'username',
    message: 'Who are you?',
  }

  const user = await inquirer.prompt(userPrompt)
    .then(response => response.username);

  await askQuestionsAndRespond(user.toLowerCase(), callback);

  console.log('Thank you for chatting.');
}

export async function createCli(callback){
  const cli = new Command();

  cli
    .name('oso-rag-chatbot')
    .description('Demo app to illustrate authorizing RAG chatbot responses with Oso Cloud.')
    .version('0.0.1');
  
  cli
    .command('start')
    .description('Start the chatbot')
    .action(() => startCommand(callback));

    cli.parse();
}