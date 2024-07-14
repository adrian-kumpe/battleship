# Exercise Multimodal User Interfaces (MBO)

This game was created as part of the exercise of [Multimodal User Interfaces](https://tu-dresden.de/ing/informatik/ai/mci/studium/lehrveranstaltungen/multimodale-benutzungsoberflaechen).

## Development

- [Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) is used to consistently format code
- Install the `git-hooks/pre-commit` Git Hook to ensure synchronization of `client/src/shared/models.ts` and `server/src/shared/models.ts`

### Available Commands

| Command         | Client                                         | Server                              |
| --------------- | ---------------------------------------------- | ----------------------------------- |
| `npm install`   | Install project dependencies                   | Install project dependencies        |
| `npm run build` | Create a production build in the `dist` folder | Create a build in the `dist` folder |
| `npm start`     | Launch the production build                    | Launch the build                    |
| `npm run dev`   | Launch a development web server                | Run build and start                 |

### Alexa Skill

Voice control for Battleship is facilitated through a custom skill for Alexa. The repository [battleship-alexa-skill](https://github.com/adrikum/battleship-alexa-skill) can be imported into an Alexa Skill. The code will then be hosted in an AWS repository. Changes can be pushed to the GitHub repository as follows: `git push https://github.com/adrikum/battleship-alexa-skill.git master`

## Summary of Exercise Tasks

### First Exercise Task

Design and implement a simple point-and-click game (battleship in this case), with the aim of making the application multimodal, specifically enabling voice control.

### Second to Fourth Exercise Tasks

Implement voice control for your game by using the Alexa Skills Kit (ASK), which involves creating an Alexa skill with intent handler functions and setting up a REST interface for the game (we just use a short socket.io connection) to receive commands from Alexa. Enhance the Alexa skill with advanced features such as speaking styles or speech emphasis.

### Fifth and Sixth Exercise Task

Expand the game application by adding mouse-based/touch-based gesture control. Implement gesture recognition using Dynamic Time Warping (DTW) to compare recorded inputs with predefined templates. Implement a slot-based system to combine point/click, voice, and gesture inputs and to ensure synchronization.

## Credits

- "Battleship" ([#4933109](https://thenounproject.com/icon/battleship-4933109/), [#4932475](https://thenounproject.com/icon/battleship-4932475/), [#4932489](https://thenounproject.com/icon/battleship-4932489/), [#4932484](https://thenounproject.com/icon/battleship-4932484/)) by [Hey Rabbit](https://thenounproject.com/creator/heyrabbit/) are licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- "[Pencil](https://thenounproject.com/icon/pencil-6467333/)" by [HideMaru](https://thenounproject.com/creator/hiddemaru/) is licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- "[explosion](https://thenounproject.com/icon/explosion-6665475/)" by [laili hidayati](https://thenounproject.com/creator/lailikepanjen/) is licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- "[Walkie Talkie](https://thenounproject.com/icon/walkie-talkie-897082/)" by [Andrejs Kirma](https://thenounproject.com/creator/andrejs/) is licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- "[captain](https://thenounproject.com/icon/captain-6129970/)" by [Nattapol Seengern](https://thenounproject.com/creator/bankseengern/) is licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- "backgorund image ocean" by macrovector on Freepik (https://www.freepik.com/free-vector/empty-underwater-blue-shine-abstract-background-light-bright-clean-ocean-sea_10601804.htm)
