import { Array, Console, Data, Effect } from "effect";
import { catchAll, flatMap, map, tap } from "effect/Effect";
import * as NodeFS from "node:fs";

const homedir = require("os").homedir();

const readFile = (filename: string) =>
  Effect.async<Quotes, NodeJS.ErrnoException>((resume) => {
    NodeFS.readFile(filename, { encoding: "utf8" }, (error, data) => {
      if (error) {
        resume(Effect.fail(error));
      } else {
        resume(Effect.succeed(JSON.parse(data)));
      }
    });
  });
const program = readFile(
  `${homedir}/Developer/desktop/ts-quote/src/quotes.json`,
).pipe(
  flatMap((value) => {
    return Effect.try({
      try: () => Data.array(value.quotes),
      catch: (error) => ({ code: "2343", error }),
    });

    //     const array = Data.array(value.quotes);
    // const quote = Array.get(getRandomNumberInRange(0, value.quotes.length - 1))(
    //   array,
    // );
    // console.log("quote i s", quote._tag);
  }),
  tap((value) => console.log("value is - ", value)),
  // map((value) =>
  //   formatQuote(
  //     value.quotes.at(getRandomNumberInRange(0, value.quotes.length - 1)),
  //   ),
  // ),
  tap((value) => Console.log(value)),
  catchAll((error) => {
    return Console.log(error?.code);
  }),
);

Effect.runPromise(program); // .catch((error) => console.log(error));

interface Quote {
  author: string;
  text: string;
}

interface Quotes {
  quotes: Array<Quote>;
}

const getRandomNumberInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const formatQuote = (value: Quote | undefined) =>
  `${value?.text}\n- ${value?.author}`;
