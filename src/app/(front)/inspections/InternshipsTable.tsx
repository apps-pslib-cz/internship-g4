"use client";

import React, {
  FC,
  useEffect,
  useState,
  useCallback,
  useContext,
  use,
} from "react";
import { AccountDrawerContext } from "@/providers/AccountDrawerProvider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Table,
  Button,
  ActionIcon,
  Text,
  TextInput,
  Alert,
  Pagination,
  Flex,
  Group,
  Drawer,
  Stack,
  ScrollArea,
  Box,
  Tooltip,
  NativeSelect,
  Anchor,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconAlertTriangle,
  IconAlertTriangleOff,
  IconInfoSmall,
  IconMapPinCheck,
  IconFlag2,
  IconFlag2Off,
  IconX,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  InternshipWithCompanyLocationSetUser,
  InternshipInspectionList,
} from "@/types/entities";
import { type ListResult } from "@/types/data";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { getInternshipKindLabel, getInternshipStateLabel } from "@/data/lists";
import { UserAvatar } from "@/components";
import { Set } from "@prisma/client";

type TInternshipsTableProps = {};
type TInternshipsTableState = {
  filterUser: string;
  filterUserGivenName: string;
  filterUserSurname: string;
  filterSet: number | undefined;
  filterCompany: number | undefined;
  filterCompanyName: string | undefined;
  filterClassname: string | undefined;
  filterReservedUser: string | undefined;
  filterHighlighted: boolean | undefined;
  filterKind: number | undefined;
  order: string;
  page: number;
  size: number;
};

const STORAGE_ID = "inspect-internships-table";

const InternshipsTable: FC = (TInternshipsTableProps) => {
  const { pageSize: generalPageSize } = useContext(AccountDrawerContext);
  const [sets, setSets] = useState<Set[]>([]);
  const [selected, setSelected] =
    React.useState<InternshipInspectionList | null>(null);
  const [onLocation, setOnLocation] = React.useState<
    InternshipWithCompanyLocationSetUser[] | null
  >(null);
  const searchParams = useSearchParams();
  const [loadTableState, storeTableState, removeTableState] =
    useSessionStorage<TInternshipsTableState>(STORAGE_ID);
  const [data, setData] = useState<ListResult<InternshipInspectionList> | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [state, setState] = useState<TInternshipsTableState>({
    filterUser: searchParams.get("user") ?? "",
    filterUserGivenName: searchParams.get("givenName") ?? "",
    filterUserSurname: searchParams.get("surname") ?? "",
    filterSet: searchParams.get("set")
      ? parseInt(searchParams.get("set") as string)
      : undefined,
    filterCompany: searchParams.get("company")
      ? parseInt(searchParams.get("company") as string)
      : undefined,
    filterCompanyName: searchParams.get("companyName") ?? "",
    filterClassname: searchParams.get("classname") ?? "",
    filterKind: searchParams.get("kind")
      ? parseInt(searchParams.get("kind") as string)
      : undefined,
    filterHighlighted:
      searchParams.get("highlighted") === "true"
        ? true
        : searchParams.get("highlighted") === "false"
          ? false
          : undefined,
    filterReservedUser: searchParams.get("reservedUser") ?? "",
    order: searchParams.get("orderBy") ?? "created",
    page: searchParams.get("page")
      ? parseInt(searchParams.get("page") as string)
      : 1,
    size: searchParams.get("size")
      ? parseInt(searchParams.get("size") as string)
      : generalPageSize,
  });
  const isMobile = useMediaQuery("(max-width: 50em)");
  const isTablet = useMediaQuery("(max-width: 992px)");

  const fetchData = useCallback(
    (
      user: string,
      givenName: string,
      surname: string,
      set: number | undefined,
      company: number | undefined,
      companyName: string | undefined,
      classname: string | undefined,
      reservedUser: string | undefined,
      kind: number | undefined,
      highlighted: boolean | undefined,
      orderBy: string,
      page: number = 1,
      pageSize: number = 10,
    ) => {
      setError(null);
      fetch(
        `/api/inspections/internships?user=${user ?? ""}&givenName=${givenName}&surname=${surname}&set=${set !== undefined ? set : ""}&company=${company ?? ""}&companyName=${companyName ?? ""}&class=${classname}&active=true&orderBy=${orderBy}&highlighter=${highlighted !== undefined ? highlighted : ""}&inspector=${reservedUser ?? ""}&kind=${kind ?? ""}&page=${page - 1}&size=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (!response.ok) {
            setData(null);
            setError(new Error("Došlo k chybě při získávání dat."));
            throw new Error("Došlo k chybě při získávání dat.");
          }
          return response.json();
        })
        .then((data) => {
          setData(data);
        })
        .catch((error) => {
          setError(error.message);
        })
        .finally(() => {});
    },
    [],
  );

  const fetchActiveSets = useCallback(async () => {
    try {
      const response = await fetch("/api/sets?active=true");
      if (!response.ok) {
        throw new Error("Failed to fetch sets");
      }
      const data = await response.json();
      setSets(data.data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error("An unknown error occurred"));
      }
    } finally {
    }
  }, []);

  const setHighlighted = useCallback(
    (id: string, value: boolean) => {
      setError(null);
      fetch(`/api/internships/${id}/highlighted`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ highlighted: value }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Došlo k chybě při zpracovávání dat.");
          }
          notifications.show({
            title: "Změna označení",
            message: "Označení praxe bylo změněno.",
            color: "green",
          });
          fetchData(
            state.filterUser,
            state.filterUserGivenName,
            state.filterUserSurname,
            state.filterSet,
            state.filterCompany,
            state.filterCompanyName,
            state.filterClassname,
            state.filterReservedUser,
            state.filterKind,
            state.filterHighlighted,
            state.order,
            state.page,
            state.size,
          );
        })
        .catch((error) => {
          setError(error.message);
          notifications.show({
            title: "Chyba",
            message: "Změna označení praxe se nepodařila.",
            color: "red",
          });
        })
        .finally(() => {});
    },
    [fetchData, state],
  );

  const fetchLocationInternships = useCallback((locationId: number) => {
    setError(null);
    fetch(
      `/api/internships?active=true&location=${locationId}&orderBy=surname`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Došlo k chybě při získávání dat.");
        }
        return response.json();
      })
      .then((data) => {
        setOnLocation(data.data);
      })
      .catch((error) => {
        notifications.show({
          title: "Chyba",
          message: "Nepodařilo se načíst seznam praxí v daném místě.",
          color: "red",
        });
      })
      .finally(() => {});
  }, []);

  const makeOneReservationForSelf = useCallback(
    (id: string) => {
      setError(null);
      fetch(`/api/internships/${id}/reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Došlo k chybě při zpracovávání dat.");
          }
          notifications.show({
            title: "Rezervace",
            message: "Praxe byla zarezervována.",
            color: "green",
          });
          fetchData(
            state.filterUser,
            state.filterUserGivenName,
            state.filterUserSurname,
            state.filterSet,
            state.filterCompany,
            state.filterCompanyName,
            state.filterClassname,
            state.filterReservedUser,
            state.filterKind,
            state.filterHighlighted,
            state.order,
            state.page,
            state.size,
          );
        })
        .catch((error) => {
          setError(error.message);
          notifications.show({
            title: "Chyba",
            message: "Rezervace praxe se nepodařila.",
            color: "red",
          });
        })
        .finally(() => {});
    },
    [fetchData, state],
  );

  const cancelReservation = useCallback(
    (id: string) => {
      setError(null);
      fetch(`/api/internships/${id}/reservation`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Došlo k chybě při zpracovávání dat.");
          }
          notifications.show({
            title: "Rezervace zrušena",
            message: "Rezervace praxe byla zrušena.",
            color: "orange",
          });
          fetchData(
            state.filterUser,
            state.filterUserGivenName,
            state.filterUserSurname,
            state.filterSet,
            state.filterCompany,
            state.filterCompanyName,
            state.filterClassname,
            state.filterReservedUser,
            state.filterKind,
            state.filterHighlighted,
            state.order,
            state.page,
            state.size,
          );
        })
        .catch((error) => {
          setError(error.message);
          notifications.show({
            title: "Chyba",
            message: "Zrušení rezervace se nepodařilo.",
            color: "red",
          });
        })
        .finally(() => {});
    },
    [fetchData, state],
  );

  const makeReservationsForUnreservedInLocation = useCallback(
    (locationId: number) => {
      setError(null);
      fetch(
        `/api/inspections/locations/${locationId}/reservations?active=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Došlo k chybě při zpracovávání dat.");
          }
          notifications.show({
            title: "Rezervace",
            message: "Praxe byly zarezervovány.",
            color: "green",
          });
          fetchData(
            state.filterUser,
            state.filterUserGivenName,
            state.filterUserSurname,
            state.filterSet,
            state.filterCompany,
            state.filterCompanyName,
            state.filterClassname,
            state.filterReservedUser,
            state.filterKind,
            state.filterHighlighted,
            state.order,
            state.page,
            state.size,
          );
        })
        .catch((error) => {
          setError(error.message);
          notifications.show({
            title: "Chyba",
            message: "Při rezervaci praxí došlo k nějaké chybě.",
            color: "red",
          });
        })
        .finally(() => {});
    },
    [fetchData, state],
  );

  useEffect(() => {
    let storedState = loadTableState();
    const searchedUser = searchParams.get("user") ?? "";
    const searchedGivenName = searchParams.get("givenName") ?? "";
    const searchedSurname = searchParams.get("surname") ?? "";
    const searchedSet = searchParams.get("set")
      ? parseInt(searchParams.get("set") as string)
      : undefined;
    const searchedCompany = searchParams.get("company")
      ? parseInt(searchParams.get("company") as string)
      : undefined;
    const searchedCompanyName = searchParams.get("companyName") ?? "";
    const searchedClassname = searchParams.get("classname") ?? "";
    const searchedKind = searchParams.get("kind")
      ? parseInt(searchParams.get("kind") as string)
      : undefined;
    const searchedReservedUser = searchParams.get("reservedUser") ?? "";
    const orderBy = searchParams.get("orderBy") ?? "created";
    const paginationPage = searchParams.get("page")
      ? parseInt(searchParams.get("page") as string)
      : 1;
    const paginationSize = searchParams.get("size")
      ? parseInt(searchParams.get("size") as string)
      : generalPageSize;
    let URLState: TInternshipsTableState = {
      filterUser: searchedUser,
      filterUserGivenName: searchedGivenName,
      filterUserSurname: searchedSurname,
      filterSet: searchedSet,
      filterCompany: searchedCompany,
      filterCompanyName: searchedCompanyName,
      filterClassname: searchedClassname,
      filterKind: searchedKind,
      filterHighlighted:
        searchParams.get("highlighted") === "true"
          ? true
          : searchParams.get("highlighted") === "false"
            ? false
            : undefined,
      filterReservedUser: searchedReservedUser,
      order: orderBy,
      page: paginationPage,
      size: paginationSize,
    };
    setState({ ...URLState });
  }, [searchParams, loadTableState, generalPageSize]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    state.filterUser !== undefined && params.set("user", state.filterUser);
    state.filterUserGivenName !== undefined &&
      params.set("givenName", state.filterUserGivenName);
    state.filterUserSurname !== undefined &&
      params.set("surname", state.filterUserSurname);
    state.filterSet !== undefined && params.set("set", String(state.filterSet));
    state.filterCompany !== undefined &&
      params.set("company", String(state.filterCompany));
    state.filterCompanyName !== undefined &&
      params.set("companyName", state.filterCompanyName);
    state.filterClassname !== undefined
      ? params.set("classname", state.filterClassname)
      : params.delete("classname");
    state.filterSet !== undefined
      ? params.set("set", String(state.filterSet))
      : params.delete("set");
    state.filterKind !== undefined &&
      params.set("kind", String(state.filterKind));
    state.filterHighlighted !== undefined &&
      params.set("highlighted", String(state.filterHighlighted));
    state.filterReservedUser !== undefined &&
      params.set("reservedUser", state.filterReservedUser);
    params.set("page", state.page.toString());
    params.set("size", state.size.toString());
    params.set("orderBy", state.order);
    window.history.replaceState(null, "", `?${params.toString()}`);
    storeTableState(state);
    fetchData(
      state.filterUser,
      state.filterUserGivenName,
      state.filterUserSurname,
      state.filterSet,
      state.filterCompany,
      state.filterCompanyName,
      state.filterClassname,
      state.filterReservedUser,
      state.filterKind,
      state.filterHighlighted,
      state.order,
      state.page,
      state.size,
    );
  }, [state, fetchData, searchParams, storeTableState]);

  useEffect(() => {
    if (selected) {
      fetchLocationInternships(selected.location.id);
    }
  }, [selected, fetchLocationInternships]);

  useEffect(() => {
    fetchActiveSets();
  }, [fetchActiveSets]);

  return (
    <>
      <Table.ScrollContainer minWidth={1300}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Text
                  fw={700}
                  onClick={() => {
                    let newOrder =
                      state.order === "givenName"
                        ? "givenName_desc"
                        : "givenName";
                    setState({ ...state, order: newOrder });
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Jméno{" "}
                  {state.order === "givenName" ? (
                    <IconChevronDown size={12} />
                  ) : state.order === "givenName_desc" ? (
                    <IconChevronUp size={12} />
                  ) : null}
                </Text>
              </Table.Th>
              <Table.Th>
                <Text
                  fw={700}
                  onClick={() => {
                    let newOrder =
                      state.order === "surname" ? "surname_desc" : "surname";
                    setState({ ...state, order: newOrder });
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Příjmení{" "}
                  {state.order === "surname" ? (
                    <IconChevronDown size={12} />
                  ) : state.order === "surname_desc" ? (
                    <IconChevronUp size={12} />
                  ) : null}
                </Text>
              </Table.Th>
              <Table.Th>
                <Text fw={700}>Sada</Text>
              </Table.Th>
              <Table.Th>
                <Text fw={700}>Třída</Text>
              </Table.Th>
              <Table.Th>
                <Text fw={700}>Firma</Text>
              </Table.Th>
              <Table.Th>
                <Text fw={700}>Způsob</Text>
              </Table.Th>
              <Table.Th>Stav</Table.Th>
              <Table.Th>Deník</Table.Th>
              <Table.Th>Kontroly</Table.Th>
              <Table.Th>Označeno</Table.Th>
              <Table.Th>Rezervováno</Table.Th>
              <Table.Th>
                <Text
                  fw={700}
                  onClick={() => {
                    let newOrder =
                      state.order === "created" ? "created_desc" : "created";
                    setState({ ...state, order: newOrder });
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Vytvořeno{" "}
                  {state.order === "created" ? (
                    <IconChevronDown size={12} />
                  ) : state.order === "created_desc" ? (
                    <IconChevronUp size={12} />
                  ) : null}
                </Text>
              </Table.Th>
              <Table.Th>Možnosti</Table.Th>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>
                <TextInput
                  size="xs"
                  value={state.filterUserGivenName}
                  onChange={(event) => {
                    setState({
                      ...state,
                      filterUserGivenName: event.currentTarget.value,
                      page: 1,
                    });
                  }}
                />
              </Table.Th>
              <Table.Th>
                <TextInput
                  size="xs"
                  value={state.filterUserSurname}
                  onChange={(event) => {
                    setState({
                      ...state,
                      filterUserSurname: event.currentTarget.value,
                      page: 1,
                    });
                  }}
                />
              </Table.Th>
              <Table.Th>
                <Table.Th>
                  <NativeSelect
                    size="xs"
                    data={[
                      { value: "", label: "- Vše -" },
                      ...sets.map((set) => ({
                        value: String(set.id),
                        label: set.name,
                      })),
                    ]}
                    value={
                      state.filterSet !== undefined
                        ? String(state.filterSet)
                        : ""
                    }
                    onChange={(event) =>
                      setState({
                        ...state,
                        filterSet: event.currentTarget.value
                          ? parseInt(event.currentTarget.value)
                          : undefined,
                        page: 1,
                      })
                    }
                  />
                </Table.Th>
              </Table.Th>
              <Table.Th>
                <TextInput
                  size="xs"
                  value={state.filterClassname}
                  onChange={(event) => {
                    setState({
                      ...state,
                      filterClassname: event.currentTarget.value
                        ? event.currentTarget.value
                        : undefined,
                      page: 1,
                    });
                  }}
                />
              </Table.Th>
              <Table.Th>
                <TextInput
                  size="xs"
                  value={state.filterCompanyName}
                  onChange={(event) => {
                    setState({
                      ...state,
                      filterCompanyName: event.currentTarget.value
                        ? event.currentTarget.value
                        : undefined,
                      page: 1,
                    });
                  }}
                />
              </Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th>
                <Button
                  size="xs"
                  onClick={(event) => {
                    setState({
                      ...state,
                      filterUser: "",
                      filterUserGivenName: "",
                      filterUserSurname: "",
                      filterSet: undefined,
                      filterCompany: undefined,
                      filterCompanyName: "",
                      filterClassname: "",
                      order: "created",
                      page: 1,
                    });
                  }}
                >
                  Vše
                </Button>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {error && (
              <Table.Tr>
                <Table.Td colSpan={100}>
                  <Alert color="red">{error.message}</Alert>
                </Table.Td>
              </Table.Tr>
            )}
            {data && data.total === 0 && (
              <Table.Tr>
                <Table.Td colSpan={100}>
                  Žádná praxe nevyhovuje podmínkám.
                </Table.Td>
              </Table.Tr>
            )}
            {data &&
              data.data?.map((internship) => (
                <Table.Tr key={internship.id}>
                  <Table.Td colSpan={2}>
                    {internship.user ? (
                      <UserAvatar
                        fullname={
                          internship.user.givenName +
                          " " +
                          internship.user.surname
                        }
                        email={internship.user.email}
                        picture={
                          internship.user.image
                            ? "data:image/jpeg;base64, " + internship.user.image
                            : null
                        }
                      />
                    ) : null}
                  </Table.Td>
                  <Table.Td>
                    <Text>{internship.set.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{internship.classname}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{internship.company.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>
                      {getInternshipKindLabel(String(internship.kind))}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>
                      {getInternshipStateLabel(String(internship.state))}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>
                      {internship.diaries ? (
                        <Anchor
                          component={Link}
                          href={`/inspections/${internship.id}/diary`}
                        >
                          {internship.diaries.length}
                        </Anchor>
                      ) : (
                        0
                      )}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text ta="center">
                      {internship.inspections ? (
                        <Anchor
                          component={Link}
                          href={`/inspections/${internship.id}/list`}
                        >
                          {internship.inspections.length}
                        </Anchor>
                      ) : (
                        0
                      )}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {internship.highlighted ? (
                      <IconFlag2 size={24} color="red" />
                    ) : null}
                  </Table.Td>
                  <Table.Td ta="left">
                    {internship.reservationUser ? (
                      <UserAvatar
                        fullname={
                          internship.reservationUser.givenName +
                          " " +
                          internship.reservationUser.surname
                        }
                        email={internship.reservationUser.email}
                        picture={
                          internship.reservationUser.image !== null &&
                          internship.reservationUser.image !== undefined
                            ? "data:image/jpeg;base64, " +
                              internship.reservationUser.image
                            : null
                        }
                      />
                    ) : (
                      <IconX />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text>{new Date(internship.created).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="sm">
                      <Tooltip label="Podrobnosti">
                        <ActionIcon
                          variant="light"
                          component={Link}
                          href={`/inspections/${internship.id}`}
                        >
                          <IconInfoSmall />
                        </ActionIcon>
                      </Tooltip>
                      {!internship.reservationUser ? (
                        <Tooltip label="Zarezervovat ke kontrole">
                          <ActionIcon
                            variant="light"
                            onClick={() => setSelected(internship)}
                          >
                            <IconMapPinCheck />
                          </ActionIcon>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Zrušit rezervaci">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => cancelReservation(internship.id)}
                          >
                            <IconX />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {internship.highlighted ? (
                        <Tooltip label="Zrušit doporučení">
                          <ActionIcon
                            variant="light"
                            color="green"
                            onClick={() => {
                              setHighlighted(internship.id, false);
                            }}
                          >
                            <IconFlag2Off />
                          </ActionIcon>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Doporučit ke kontrole">
                          <ActionIcon
                            variant="light"
                            color="orange"
                            onClick={() => {
                              setHighlighted(internship.id, true);
                            }}
                          >
                            <IconFlag2 />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Flex justify="center">
        <Pagination
          total={Math.ceil((data?.total ?? 0) / (data?.size ?? 10))}
          value={(data?.page ?? 1) + 1}
          onChange={(page) =>
            /*setPage(page)*/ setState({ ...state, page: page })
          }
        />
      </Flex>
      <Drawer
        opened={selected != null}
        onClose={() => setSelected(null)}
        title="Rezervace ke kontrole"
        position="right"
        zIndex={1000}
        padding="md"
      >
        <Stack>
          <Text>Na stejném místě se nacházejí tyto praxe:</Text>
          <ScrollArea>
            <Stack>
              {onLocation &&
                onLocation.map((internship) => (
                  <Box key={internship.id}>
                    <Text size="sm">
                      {internship.user.givenName +
                        " " +
                        internship.user.surname +
                        " (" +
                        internship.classname +
                        ")"}
                    </Text>
                    <Text c="dimmed" size="xs">
                      {internship.company.name}
                    </Text>
                  </Box>
                ))}
            </Stack>
          </ScrollArea>
          <Button
            variant="filled"
            onClick={() => {
              if (selected != null) {
                makeReservationsForUnreservedInLocation(selected.location.id);
                setSelected(null);
              }
              setSelected(null);
            }}
          >
            Zarezervovat všechny
          </Button>
          <Text>nebo</Text>
          <Button
            variant="default"
            onClick={() => {
              if (selected != null) {
                makeOneReservationForSelf(selected.id);
                setSelected(null);
              }
            }}
          >
            Zarezervovat jen tuto praxi
          </Button>
        </Stack>
      </Drawer>
    </>
  );
};

export default InternshipsTable;
