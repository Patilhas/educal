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
import { EVENT_CATEGORY_KEYS } from "@/features/calendar/constants";
import { getEventCategoryLabel, getEventColorByCategory } from "@/features/calendar/helpers";

export default function FilterEvents() {
	const { selectedCategories, filterEventsBySelectedCategories, clearFilter } =
		useCalendar();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Toggle variant="outline" className="cursor-pointer w-fit">
					<Filter className="h-4 w-4" />
				</Toggle>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[220px]">
				{EVENT_CATEGORY_KEYS.map((category) => {
					const color = getEventColorByCategory(category);

					return (
					<DropdownMenuItem
						key={category}
						className="flex items-center gap-2 cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							filterEventsBySelectedCategories(category);
						}}
					>
						<div
							className={`size-3.5 rounded-full bg-${color}-600 dark:bg-${color}-700`}
						/>
						<span className="flex justify-center items-center gap-2">
							{getEventCategoryLabel(category)}
							<span>
								{selectedCategories.includes(category) && (
									<span className="text-blue-500">
										<CheckIcon className="size-4" />
									</span>
								)}
							</span>
						</span>
					</DropdownMenuItem>
					);
				})}
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
					Limpar Filtro
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
