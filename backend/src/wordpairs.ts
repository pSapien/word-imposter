import abstract from "./words/abstract.js";
import fantasy from "./words/fantasy.js";
import food from "./words/food.js";
import general from "./words/general.js";
import geography from "./words/geography.js";
import hobbies from "./words/hobbies.js";
import legacy from "./words/legacy.js";
import pop from "./words/pop.js";
import science from "./words/science.js";
import synonms from "./words/synonms.js";

const WordPairsCategory = [
  { label: "Abstract", value: "abstract", words: abstract },
  { label: "Fantasy", value: "fantasy", words: fantasy },
  { label: "Food", value: "food", words: food },
  { label: "General", value: "general", words: general },
  { label: "Geography", value: "geography", words: geography },
  { label: "Hobbies", value: "hobbies", words: hobbies },
  { label: "Legacy", value: "legacy", words: legacy },
  { label: "Pop Culture", value: "pop", words: pop },
  { label: "Science", value: "science", words: science },
  { label: "Synonyms", value: "synonms", words: synonms },
];

export function getWordsList() {
  return WordPairsCategory.slice();
}

export function getRandomWordPair(category: string): { civilianWord: string; imposterWord: string } {
  const categoryData = getWordsList().find((cat) => cat.value === category);
  const categoryList = categoryData?.words ?? legacy;

  const randomPairIndex = Math.floor(Math.random() * categoryList.length);
  const selectedPair = categoryList[randomPairIndex];
  const randomAssignment = Math.floor(Math.random() * 2);
  return {
    civilianWord: selectedPair[randomAssignment],
    imposterWord: selectedPair[1 - randomAssignment],
  };
}
