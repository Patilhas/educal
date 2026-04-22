import "server-only";
import { authService } from "@/server/auth/services/auth.service";
import { calendarService } from "@/server/calendar/services/calendar.service";

export const getEvents = async () => {
	return await calendarService.listEvents();
};

export const getUsers = async () => {
	return await authService.listCalendarUsers();
};

export const getEventEnums = async () => {
	return await calendarService.listEnums();
};

