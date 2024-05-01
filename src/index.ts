import { Array, Console, Data, Effect } from "effect";
import { catchAll, flatMap, map, tap } from "effect/Effect";
import * as NodeFS from "node:fs";

const homedir = require("os").homedir();

const readFile = (filename: string) =>
  Effect.async<Quotes, { code: string; error: unknown }>((resume) => {
    NodeFS.readFile(filename, { encoding: "utf8" }, (error, data) => {
      if (error) {
        resume(Effect.fail({ code: error.code ?? "File read error", error }));
      } else {
        resume(
          Effect.try({
            try: () => JSON.parse(data),
            catch: (error) => ({ code: "PARSE_ERROR", error }),
          }),
        );
      }
    });
  });
const program = readFile(`${homedir}/.config/quotes/quotes.json`).pipe(
  flatMap((value) => {
    return Effect.try({
      try: () => Data.array(value.quotes),
      catch: (error) => ({ code: "PARSE_ERROR", error }),
    });
  }),
  map((value) =>
    formatQuote(value.at(getRandomNumberInRange(0, value.length - 1))),
  ),
  tap((value) => Console.log(value)),
  catchAll((error) => {
    if (error.code === "ENOENT") {
      return Console.log("File not found");
    } else if (error.code === "PARSE_ERROR") {
      return Console.log("JSON not formatted correctly");
    } else {
      return Console.log(error?.code);
    }
  }),
);

Effect.runPromise(program);

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
