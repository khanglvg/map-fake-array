export function logInfo(prefix, msg, ...params) {
	console.log(`${prefix} - ${msg}`, ...params);
}

export function logError(prefix, msg, ...params) {
	console.error(`${prefix} - ${msg}`, ...params);
}