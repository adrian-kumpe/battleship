# Multimodal User Interfaces (MBO)

## Summary of exercise tasks

### First exercise task

Design and implement a simple point-and-click game (Battleship in this case), with the aim of making the application multimodal, specifically enabling voice control.

### Second and third exercise tasks

Implement voice control for your game by using the Alexa Skills Kit (ASK), which involves creating an Alexa skill with intent handler functions and setting up a REST interface for the game to receive commands from Alexa.

### Fourth exercise task

Enhance the Alexa skill with advanced features such as speech emphasis.

### Fifth and sixth exercise task
Expand the game application by adding mouse-based/touch-based gesture control. Implement gesture recognition using Dynamic Time Warping (DTW) to compare recorded inputs with predefined templates. Integrate a multimodal fusion component to interpret combinations of point/click, voice, and gesture inputs as game commands. Implement a slot-based system to combine inputs from different modalities and ensure synchronization.

## Development

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.
[esbenp.prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
[dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

### Client

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm install`   | Install project dependencies                   |
| `npm run build` | Create a production build in the `dist` folder |
| `npm start`     | Launch the production build                    |
| `npm run dev`   | Launch a development web server                |

### Server

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm install`   | Install project dependencies        |
| `npm run build` | Create a build in the `dist` folder |
| `npm start`     | Launch the build                    |

### Alexa Skill

Voice control for Battleship is facilitated through a custom skill for Alexa. The repository **battleship-alexa-skill** can be imported into an Alexa Skill. The code will then be hosted in an AWS repository. Changes can be pushed to the GitHub repository as follows:

1. `git remote add temp https://github.com/adrikum/battleship-alexa-skill.git`
1. `git push temp master`
1. `git remote remove temp`

- shared ordner für server und client schwer umsetzbar --> einfachste Lösung: im Client und Server gibt es einen shared Ordner mit einer models.ts. Damit beide models.ts immer synchron bleiben, bitte den Git Hook git-hooks/pre-commit in .git/hooks/ kopieren. Der wirft einen Error, wenn die beiden Dateien bei einem Commit nicht übereinstimmen.
