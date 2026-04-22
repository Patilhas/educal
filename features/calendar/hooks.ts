import { useRef, useState, useSyncExternalStore } from "react";

export function useDisclosure({
	defaultIsOpen = false,
}: {
	defaultIsOpen?: boolean;
} = {}) {
	const [isOpen, setIsOpen] = useState(defaultIsOpen);

	const onOpen = () => setIsOpen(true);
	const onClose = () => setIsOpen(false);
	const onToggle = () => setIsOpen((currentValue) => !currentValue);

	return { onOpen, onClose, isOpen, onToggle };
}

export const useLocalStorage = <T>(
	key: string,
	initialValue: T,
	): [T, (value: T | ((previousValue: T) => T)) => void] => {
	const eventName = `local-storage:${key}`;
	const cachedRawValueRef = useRef<string | null>(null);
	const cachedParsedValueRef = useRef<T>(initialValue);

	const readValue = (): T => {
		if (typeof window === "undefined") {
			return initialValue;
		}

		try {
			const item = window.localStorage.getItem(key);

			if (item === cachedRawValueRef.current) {
				return cachedParsedValueRef.current;
			}

			const parsedValue = item !== null ? (JSON.parse(item) as T) : initialValue;
			cachedRawValueRef.current = item;
			cachedParsedValueRef.current = parsedValue;

			return parsedValue;
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
			return initialValue;
		}
	};

	const subscribe = (callback: () => void) => {
		if (typeof window === "undefined") {
			return () => {};
		}

		const onStorageChange = (event: StorageEvent) => {
			if (event.key === key) {
				callback();
			}
		};

		const onLocalChange = () => callback();

		window.addEventListener("storage", onStorageChange);
		window.addEventListener(eventName, onLocalChange);

		return () => {
			window.removeEventListener("storage", onStorageChange);
			window.removeEventListener(eventName, onLocalChange);
		};
	};

	const storedValue = useSyncExternalStore(
		subscribe,
		readValue,
		() => initialValue,
	);

	const setValue = (value: T | ((previousValue: T) => T)) => {
		const previousValue = readValue();
		const valueToStore =
			typeof value === "function"
				? (value as (previousValue: T) => T)(previousValue)
				: value;

		try {
			if (typeof window !== "undefined") {
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
				cachedRawValueRef.current = window.localStorage.getItem(key);
				cachedParsedValueRef.current = valueToStore;
				window.dispatchEvent(new Event(eventName));
			}
		} catch (error) {
			console.warn(`Error setting localStorage key "${key}":`, error);
		}
	};

	return [storedValue, setValue];
};

export function useMediaQuery(query: string): boolean {
	const subscribe = (callback: () => void) => {
		const media = window.matchMedia(query);
		const listener = () => callback();
		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	};

	const getSnapshot = () => window.matchMedia(query).matches;
	const getServerSnapshot = () => false;

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
