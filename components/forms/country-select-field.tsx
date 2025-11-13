import { Controller } from "react-hook-form";
import { Label } from "../ui/label";
import countryList from "react-select-country-list";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CountrySelectField = ({
  name,
  label,
  control,
  error,
  required = false,
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false);

  type CountryOption = { label: string; value: string };

  const options = useMemo<CountryOption[]>(
    () => countryList().getData() as CountryOption[],
    []
  );

  // Helper function to get flag emoji
  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="country-select-trigger"
              >
                {field.value ? (
                  <span className="flex items-center gap-2">
                    <span>{getFlagEmoji(field.value)}</span>
                    <span>
                      {options.find((c) => c.value === field.value)?.label}
                    </span>
                  </span>
                ) : (
                  "Select your country..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-full p-0 bg-gray-800 border-gray-600"
              align="start"
            >
              <Command className="bg-gray-800 border-gray-600">
                <CommandInput
                  placeholder="Search countries..."
                  className="country-select-input"
                />
                <CommandEmpty className="country-select-empty">
                  No country found.
                </CommandEmpty>
                <CommandList className="max-h-60 bg-gray-800 scrollbar-hide-default">
                  <CommandGroup heading="Suggestions">
                    {options.map((country) => (
                      <CommandItem
                        key={country.value}
                        onSelect={() => {
                          field.onChange?.(country.value);
                          setOpen(false);
                        }}
                        className="country-select-item"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-yellow-500",
                            field.value === country.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="flex items-center gap-2">
                          <span>{getFlagEmoji(country.value)}</span>
                          <span>{country.label}</span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
      <p className="text-xs text-gray-500">
        Helps us show market data and news relevant to you.
      </p>
    </div>
  );
};

export default CountrySelectField;
