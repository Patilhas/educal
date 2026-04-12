import { CheckIcon, Filter, RefreshCcw } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import {
	getEventCategoryLabel,
	getFilterDotColorClass,
} from "@/features/calendar/helpers";
import { useTranslations } from "@/i18n/use-translations";
import { useEventEnums } from "@/features/calendar/hooks/use-event-enums";

export function FilterEvents() {
	const {
		selectedCategories,
		filterEventsBySelectedCategories,
		clearFilter,
		getEventColor,
	} = useCalendar();
	const enums = useEventEnums();
	const { t } = useTranslations();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Toggle variant="outline" className="cursor-pointer w-fit">
					<Filter className="h-4 w-4" />
				</Toggle>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[220px]">
				{enums.categories.map(({ value }) => (
					<DropdownMenuItem
						key={value}
						className="flex items-center gap-2 cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							filterEventsBySelectedCategories(value);
						}}
					>
						<div
							className={`size-3.5 rounded-full ${getFilterDotColorClass(getEventColor(value))}`}
						/>
						<span className="flex justify-center items-center gap-2">
							{t(getEventCategoryLabel(value))}
							<span>
								{selectedCategories.includes(value) && (
									<span className="text-blue-500">
										<CheckIcon className="size-4" />
									</span>
								)}
							</span>
						</span>
					</DropdownMenuItem>
				))}
				<Separator className="my-2" />
				<DropdownMenuItem
					disabled={selectedCategories.length === 0}
					className="flex gap-2 cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						clearFilter();
					}}
				>
					<RefreshCcw className="size-3.5" />
					{t("calendar.filters.clearFilter")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
