import express from 'express';
const app = express();
const port = 3001;

app.get('/', (req: any, res: any) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
