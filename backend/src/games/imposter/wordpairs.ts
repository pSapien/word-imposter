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
import animal from "./words/animal.js";
import culinary from "./words/culinary.js";
import history from "./words/history.js";
import music from "./words/music.js";
import people from "./words/people.js";
import nature from "./words/nature.js";
import profession from "./words/profession.js";
import sports from "./words/sports.js";
import technology from "./words/technology.js";
import vehicle from "./words/vehicle.js";
import nepali from "./words/nepali.js";

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
  { label: "Animal", value: "animal", words: animal },
  { label: "Culinary", value: "culinary", words: culinary },
  { label: "History", value: "history", words: history },
  { label: "Music", value: "music", words: music },
  { label: "People", value: "people", words: people },
  { label: "Nature", value: "nature", words: nature },
  { label: "Profession", value: "profession", words: profession },
  { label: "Sports", value: "sports", words: sports },
  { label: "Technology", value: "technology", words: technology },
  { label: "Vehicle", value: "vehicle", words: vehicle },
  { label: "Nepali", value: "nepali", words: nepali },
];

export function getWordsList() {
  return WordPairsCategory.slice();
}

export function getRandomWordPair(category: string): { civilianWord: string; imposterWord: string } {
  const categoryData = getWordsList().find((cat) => cat.value === category);
  const categoryList = categoryData?.words ?? legacy;

  const randomPairIndex = Math.floor(Math.random() * categoryList.length);
  const selectedPair = categoryList[randomPairIndex]!;
  const randomAssignment = Math.floor(Math.random() * 2);

  return {
    imposterWord: selectedPair[1 - randomAssignment]!,
    civilianWord: selectedPair[randomAssignment]!,
  };
}
