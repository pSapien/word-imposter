/**
 * an interface to interact with window.localStorage
 *
 * @code
 * const storageEmail = new Storage<string>('email');
 * storageEmail.get()          // get the email from the localStorage
 * storageEmail.set(newValue) // set the email to the localStorage
 * storageEmail.remove()     // removes the key from the localStorage
 */

import { useEffect, useState } from "react";

export type Subscriber<T> = (args: T) => void;

export class LocalStorage<T> {
  private subscribers = new Set<Subscriber<T>>();
  key: string;
  defaultValue: T;

  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  private publish(newValue: T) {
    this.subscribers.forEach((subscriber) => subscriber(newValue));
  }

  public subscribe(subscriber: Subscriber<T>) {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public get(): T {
    const storageItem = window.localStorage.getItem(this.key);
    if (!storageItem) return this.defaultValue;

    return JSON.parse(storageItem);
  }

  public set(newValue: T) {
    this.publish(newValue);
    window.localStorage.setItem(this.key, JSON.stringify(newValue));
  }

  public remove() {
    this.publish(this.defaultValue);
    window.localStorage.removeItem(this.key);
  }
}

export function useLocalStorage<T>(storage: LocalStorage<T>) {
  const [value, setValue] = useState<T>(() => storage.get());

  useEffect(() => {
    return storage.subscribe(setValue);
  }, [storage]);

  return [value, storage.set.bind(storage)] as const;
}
