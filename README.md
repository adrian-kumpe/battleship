# Multimodal User Interfaces ([MBO](https://tu-dresden.de/ing/informatik/ai/mci/studium/lehrveranstaltungen/multimodale-benutzungsoberflaechen))

## Summary of Exercise Tasks

### First Exercise Task

Design and implement a simple point-and-click game (Battleship in this case), with the aim of making the application multimodal, specifically enabling voice control.

### Second and Third Exercise Tasks

Implement voice control for your game by using the Alexa Skills Kit (ASK), which involves creating an Alexa skill with intent handler functions and setting up a REST interface for the game to receive commands from Alexa.

### Fourth Exercise Task

Enhance the Alexa skill with advanced features such as speech emphasis.

### Fifth and Sixth Exercise Task

Expand the game application by adding mouse-based/touch-based gesture control. Implement gesture recognition using Dynamic Time Warping (DTW) to compare recorded inputs with predefined templates. Integrate a multimodal fusion component to interpret combinations of point/click, voice, and gesture inputs as game commands. Implement a slot-based system to combine inputs from different modalities and ensure synchronization.

## Development

- [Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) is used to consistently format code

### Available Commands

| Command         | Client                                         | Server                              |
| --------------- | ---------------------------------------------- | ----------------------------------- |
| `npm install`   | Install project dependencies                   | Install project dependencies        |
| `npm run build` | Create a production build in the `dist` folder | Create a build in the `dist` folder |
| `npm start`     | Launch the production build                    | Launch the build                    |
| `npm run dev`   | Launch a development web server                | Run build and start                 |


### Alexa Skill

Voice control for Battleship is facilitated through a custom skill for Alexa. The repository [battleship-alexa-skill](https://github.com/adrikum/battleship-alexa-skill) can be imported into an Alexa Skill. The code will then be hosted in an AWS repository. Changes can be pushed to the GitHub repository as follows: `git push https://github.com/adrikum/battleship-alexa-skill.git master`

### Git Hooks

To ensure  `client/src/shared/models.ts` and `server/src/shared/models.ts` are synchronized, a pre-commit Git Hook checks if both files are identical before committing. To install, copy `git-hooks/pre-commit` into the `.git/hooks/` directory.
