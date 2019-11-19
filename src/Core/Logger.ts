export class Logger {
	private static Prefix = "[DreamECS]";

	static error(...args: any[]): any {
		console.error(Logger.Prefix, ...args);
		return args[0];
	}
}
