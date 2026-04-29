"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
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
  Anchor,
  Stack,
  ScrollArea,
  Box,
  Tooltip,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconAlertTriangle,
  IconAlertTriangleOff,
  IconInfoSmall,
  IconCalendarEvent,
  IconFlag2,
  IconListCheck,
  IconPlus,
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
import { useSession } from "next-auth/react";
import { Role } from "@/types/auth";

type TInternshipsTableProps = {};
type TInternshipsTableState = {
  filterUser: string;
  filterUserGivenName: string;
  filterUserSurname: string;
  filterSet: number | undefined;
  filterCompany: number | undefined;
  filterCompanyName: string | undefined;
  filterClassname: string | undefined;
  filterHighlighted: boolean | undefined;
  filterKind: number | undefined;
  order: string;
  page: number;
  size: number;
};

const STORAGE_ID = "inspect-internships-table";

const ReservationsTable: FC<TInternshipsTableProps> = () => {
  const searchParams = useSearchParams();
  const [loadTableState, storeTableState, removeTableState] =
    useSessionStorage<TInternshipsTableState>(STORAGE_ID);
  const [data, setData] = useState<ListResult<InternshipInspectionList> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
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
    order: searchParams.get("orderBy") ?? "created",
    page: searchParams.get("page")
      ? parseInt(searchParams.get("page") as string)
      : 1,
    size: searchParams.get("size")
      ? parseInt(searchParams.get("size") as string)
      : 10,
  });
  const { data: session, status } = useSession();
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
      kind: number | undefined,
      highlighted: boolean | undefined,
      orderBy: string,
      page: number = 1,
      pageSize: number = 10,
    ) => {
      setError(null);
      fetch(
        `/api/inspections/internships?user=${user ?? ""}&givenName=${givenName}&surname=${surname}&set=${set !== undefined ? set : ""}&company=${company ?? ""}&companyName=${companyName ?? ""}&class=${classname}&active=true&orderBy=${orderBy}&highlighter=${highlighted !== undefined ? highlighted : ""}&inspector=${session?.user.id}&kind=${kind ?? ""}&page=${page - 1}&size=${pageSize}`,
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
            setError("Došlo k chybě při získávání dat.");
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

  const cancelReservation = useCallback(
    (id: string) => {
      fetch(`/api/internships/${id}/reservation`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
            state.filterKind,
            state.filterHighlighted,
            state.order,
            state.page,
            state.size,
          );
        })
        .catch(() => {
          notifications.show({
            title: "Chyba",
            message: "Zrušení rezervace se nepodařilo.",
            color: "red",
          });
        });
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
    const orderBy = searchParams.get("orderBy") ?? "created";
    const paginationPage = searchParams.get("page")
      ? parseInt(searchParams.get("page") as string)
      : 1;
    const paginationSize = searchParams.get("size")
      ? parseInt(searchParams.get("size") as string)
      : 10;
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
      order: orderBy,
      page: paginationPage,
      size: paginationSize,
    };
    setState({ ...URLState });
  }, [searchParams, loadTableState]);

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
    state.filterClassname !== undefined &&
      params.set("classname", state.filterClassname);
    state.filterKind !== undefined &&
      params.set("kind", String(state.filterKind));
    state.filterHighlighted !== undefined &&
      params.set("highlighted", String(state.filterHighlighted));
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
      state.filterKind,
      state.filterHighlighted,
      state.order,
      state.page,
      state.size,
    );
  }, [state, fetchData, searchParams, storeTableState]);

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
                      state.order === "" ? "givenName_desc" : "givenName";
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
                      state.order === "" ? "surname_desc" : "surname";
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
                <Text fw={700}>Třída</Text>
              </Table.Th>
              <Table.Th>
                <Text fw={700}>Sada</Text>
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
              <Table.Th></Table.Th>
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
                  <Alert color="red">{error}</Alert>
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
                    <Text>{internship.classname}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{internship.set.name}</Text>
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
                    <Anchor href={`/inspections/${internship.id}/diary`}>
                      {internship.diaries ? internship.diaries.length : 0}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Anchor href={`/inspections/${internship.id}/list`}>
                      {internship.inspections
                        ? internship.inspections.length
                        : 0}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    {internship.highlighted ? (
                      <IconFlag2 size={24} color="red" />
                    ) : null}
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
                      <Tooltip label="Deník">
                        <ActionIcon
                          variant="light"
                          component={Link}
                          href={`/inspections/${internship.id}/diary`}
                        >
                          <IconCalendarEvent />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Kontroly">
                        <ActionIcon
                          variant="light"
                          component={Link}
                          href={`/inspections/${internship.id}/list`}
                        >
                          <IconListCheck />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Nová kontrola">
                        <ActionIcon
                          variant="light"
                          component={Link}
                          href={`/inspections/${internship.id}/create`}
                        >
                          <IconPlus />
                        </ActionIcon>
                      </Tooltip>
                      {session?.user.role === Role.ADMIN ||
                      internship.reservationUser?.id === session?.user.id ? (
                        <Tooltip label="Zrušit rezervaci">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => cancelReservation(internship.id)}
                          >
                            <IconX />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
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
    </>
  );
};

export default ReservationsTable;
