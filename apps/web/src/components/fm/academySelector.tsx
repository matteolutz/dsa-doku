import { trpc, useLoggedInState } from '@/utils/trpc';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';

const AcademySelector = () => {
  const [loggedInState, setLoggedInState] = useLoggedInState();

  const academiesQuery = useQuery(trpc.academy.getSelectable.queryOptions());

  const selectAcademy = useEffectEvent((academyId: number) => {
    setLoggedInState((current) => ({
      ...current,
      selectedAcademy: academyId
    }));
  });
  useEffect(() => {
    if (
      typeof academiesQuery.data === 'undefined' ||
      academiesQuery.data.length === 0
    )
      return;

    if (loggedInState.selectedAcademy !== null) return;

    selectAcademy(academiesQuery.data[0].id);
  }, [academiesQuery.data, loggedInState]);

  return (
    <Select
      onValueChange={(value) =>
        setLoggedInState((state) => ({
          ...state,
          selectedAcademy: Number(value)
        }))
      }
      value={loggedInState.selectedAcademy?.toString()}
    >
      <SelectTrigger size="sm" className="w-60">
        <SelectValue placeholder="Akademie auswählen" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {academiesQuery.data?.map((academy) => (
            <SelectItem key={academy.id} value={academy.id.toString()}>
              {academy.location} {academy.year}-{academy.yearIdx}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default AcademySelector;
