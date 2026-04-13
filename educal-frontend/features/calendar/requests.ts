import "server-only";
import { calendarService } from "@/server/calendar/services/calendar.service";

export const getEvents = async () => {
	return await calendarService.listEvents();
};

export const getUsers = async () => {
	return await calendarService.listUsers();
};

export const getEventEnums = async () => {
	return await calendarService.listEnums();
};

