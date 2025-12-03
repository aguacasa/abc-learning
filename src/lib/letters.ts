export interface Letter {
  id: string;
  display: string;
  back: string;
  word: string;
  sound: string;
}

export const letters: Letter[] = [
  { id: "A", display: "A", back: "A", word: "Apple", sound: "A is for Apple" },
  { id: "B", display: "B", back: "B", word: "Ball", sound: "B is for Ball" },
  { id: "C", display: "C", back: "C", word: "Cat", sound: "C is for Cat" },
  { id: "D", display: "D", back: "D", word: "Dog", sound: "D is for Dog" },
  {
    id: "E",
    display: "E",
    back: "E",
    word: "Elephant",
    sound: "E is for Elephant",
  },
  { id: "F", display: "F", back: "F", word: "Fish", sound: "F is for Fish" },
  {
    id: "G",
    display: "G",
    back: "G",
    word: "Guitar",
    sound: "G is for Guitar",
  },
  { id: "H", display: "H", back: "H", word: "Hat", sound: "H is for Hat" },
  { id: "I", display: "I", back: "I", word: "Igloo", sound: "I is for Igloo" },
  { id: "J", display: "J", back: "J", word: "Juice", sound: "J is for Juice" },
  { id: "K", display: "K", back: "K", word: "Kite", sound: "K is for Kite" },
  { id: "L", display: "L", back: "L", word: "Lion", sound: "L is for Lion" },
  { id: "M", display: "M", back: "M", word: "Moon", sound: "M is for Moon" },
  { id: "N", display: "N", back: "N", word: "Nest", sound: "N is for Nest" },
  {
    id: "O",
    display: "O",
    back: "O",
    word: "Octopus",
    sound: "O is for Octopus",
  },
  { id: "P", display: "P", back: "P", word: "Pig", sound: "P is for Pig" },
  { id: "Q", display: "Q", back: "Q", word: "Queen", sound: "Q is for Queen" },
  {
    id: "R",
    display: "R",
    back: "R",
    word: "Rainbow",
    sound: "R is for Rainbow",
  },
  { id: "S", display: "S", back: "S", word: "Sun", sound: "S is for Sun" },
  {
    id: "T",
    display: "T",
    back: "T",
    word: "Turtle",
    sound: "T is for Turtle",
  },
  {
    id: "U",
    display: "U",
    back: "U",
    word: "Umbrella",
    sound: "U is for Umbrella",
  },
  {
    id: "V",
    display: "V",
    back: "V",
    word: "Violin",
    sound: "V is for Violin",
  },
  { id: "W", display: "W", back: "W", word: "Whale", sound: "W is for Whale" },
  { id: "X", display: "X", back: "X", word: "X-Ray", sound: "X is for X-Ray" },
  { id: "Y", display: "Y", back: "Y", word: "Yo-Yo", sound: "Y is for Yo-Yo" },
  { id: "Z", display: "Z", back: "Z", word: "Zebra", sound: "Z is for Zebra" },
];
