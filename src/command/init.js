/**
 * @file init 命令
 * @author ielgnaw(wuji0223@gmail.com)
 */

import inquirer from 'inquirer';
import BottomBar from 'inquirer/lib/ui/bottom-bar';
import cmdify from 'cmdify';
import ora from 'ora';

var directionsPrompt = {
  type: 'list',
  name: 'direction',
  message: 'Which direction would you like to go?',
  choices: ['Forward', 'Right', 'Left', 'Back']
};

function main() {
  console.log('You find youself in a small room, there is a door in front of you.');
  exitHouse();
}

function exitHouse() {
  inquirer.prompt(directionsPrompt).then(function (answers) {
    if (answers.direction === 'Forward') {
      console.log('You find yourself in a forest');
      console.log('There is a wolf in front of you; a friendly looking dwarf to the right and an impasse to the left.');
      encounter1();
    } else {
      console.log('You cannot go that way. Try again');
      exitHouse();
    }
  });
}

function encounter1() {
  inquirer.prompt(directionsPrompt).then(function (answers) {
    var direction = answers.direction;
    if (direction === 'Forward') {
      console.log('You attempt to fight the wolf');
      console.log('Theres a stick and some stones lying around you could use as a weapon');
      encounter2b();
    } else if (direction === 'Right') {
      console.log('You befriend the dwarf');
      console.log('He helps you kill the wolf. You can now move forward');
      encounter2a();
    } else {
      console.log('You cannot go that way');
      encounter1();
    }
  });
}

function encounter2a() {
  inquirer.prompt(directionsPrompt).then(function (answers) {
    var direction = answers.direction;
    if (direction === 'Forward') {
      var output = 'You find a painted wooden sign that says:';
      output += ' \n';
      output += ' ____  _____  ____  _____ \n';
      output += '(_  _)(  _  )(  _ \\(  _  ) \n';
      output += '  )(   )(_)(  )(_) ))(_)(  \n';
      output += ' (__) (_____)(____/(_____) \n';
      console.log(output);
    } else {
      console.log('You cannot go that way');
      encounter2a();
    }
  });
}

function encounter2b() {
  inquirer.prompt({
    type: 'list',
    name: 'weapon',
    message: 'Pick one',
    choices: [
      'Use the stick',
      'Grab a large rock',
      'Try and make a run for it',
      'Attack the wolf unarmed'
    ]
  }).then(function () {
    console.log('The wolf mauls you. You die. The end.');
  });
}

export default {
    command: ['init [directory]'],
    describe: 'Initialize project in the current directory or specified directory',
    builder: {},
    handler: argv => {
        // var questions = [
        //   {
        //     type: 'input',
        //     name: 'first_name',
        //     message: 'What\'s your first name'
        //   },
        //   {
        //     type: 'input',
        //     name: 'last_name',
        //     message: 'What\'s your last name',
        //     default: function () {
        //       return 'Doe';
        //     }
        //   },
        //   {
        //     type: 'input',
        //     name: 'phone',
        //     message: 'What\'s your phone number',
        //     validate: function (value) {
        //       var pass = value.match(/^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i);
        //       if (pass) {
        //         return true;
        //       }

        //       return 'Please enter a valid phone number';
        //     }
        //   }
        // ];

        // inquirer.prompt(questions).then(function (answers) {
        //   console.log(JSON.stringify(answers, null, '  '));
        // });

        // main();

        // inquirer.prompt([
        //       {
        //         type: 'checkbox',
        //         message: 'Select toppings',
        //         name: 'toppings',
        //         choices: [
        //           new inquirer.Separator(' = The Meats = '),
        //           {
        //             name: 'Pepperoni'
        //           },
        //           {
        //             name: 'Ham'
        //           },
        //           {
        //             name: 'Ground Meat'
        //           },
        //           {
        //             name: 'Bacon'
        //           },
        //           new inquirer.Separator(' = The Cheeses = '),
        //           {
        //             name: 'Mozzarella',
        //             checked: true
        //           },
        //           {
        //             name: 'Cheddar'
        //           },
        //           {
        //             name: 'Parmesan'
        //           },
        //           new inquirer.Separator(' = The usual ='),
        //           {
        //             name: 'Mushroom'
        //           },
        //           {
        //             name: 'Tomato'
        //           },
        //           new inquirer.Separator(' = The extras = '),
        //           {
        //             name: 'Pineapple'
        //           },
        //           {
        //             name: 'Olives',
        //             disabled: 'out of stock'
        //           },
        //           {
        //             name: 'Extra cheese'
        //           }
        //         ],
        //         validate: function (answer) {
        //           if (answer.length < 1) {
        //             return 'You must choose at least one topping.';
        //           }
        //           return true;
        //         }
        //       }
        //     ]).then(function (answers) {
        //       console.log(JSON.stringify(answers, null, '  '));
        //     });

        var loader = [
          '/ Installing',
          '| Installing',
          '\\ Installing',
          '- Installing'
        ];
        var i = 4;
        var ui = new BottomBar({bottomBar: loader[i % 4]});

        setInterval(function () {
          ui.updateBottomBar(loader[i++ % 4]);
        }, 300);

        var spawn = require('child_process').spawn;

        var cmd = spawn(cmdify('npm'), ['-g', 'install', 'inquirer'], {stdio: 'pipe'});
        cmd.stdout.pipe(ui.log);
        cmd.on('close', function () {
          ui.updateBottomBar('Installation done!\n');
          process.exit();
        });

        // const spinner = new ora({
        //     text: 'Loading unicorns'
        // });

        // spinner.start();

        // setTimeout(() => {
        //     spinner.color = 'yellow';
        //     spinner.text = 'Loading rainbows';
        // }, 1000);

        // setTimeout(() => {
        //     spinner.succeed('succeed');
        //     spinner.fail('fail');
        //     spinner.warn('warn');
        //     spinner.info('info');
        //     spinner.stopAndPersist({symbol: '@', text: 'all done'});
        // }, 2000);
        // console.log(argv);
    }
};
