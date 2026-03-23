import {setDefaultOptions} from "date-fns";
import {pt} from "date-fns/locale";

// Ensure date-fns helpers default to Portuguese when no locale is explicitly provided.
setDefaultOptions({ locale: pt });

