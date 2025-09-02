"use client";

import { useContext, useMemo } from "react";
import { AccountDrawerContext } from "@/providers/AccountDrawerProvider";
import Link from "next/link";
import {
  AppShell,
  Group,
  Burger,
  Flex,
  Divider,
  Drawer,
  ScrollArea,
  Container,
  Anchor,
  Text,
  rem,
  Avatar,
} from "@mantine/core";
import { useDisclosure, useHeadroom } from "@mantine/hooks";
import { useSession, signIn } from "next-auth/react";
import { Role } from "@/types/auth";
import Image from "next/image";
import {
  SignButton,
  UserAvatar,
  SignIcon,
  ThemeIcon,
  MainLogo,
} from "@/components";
import styles from "./layout.module.css";
import ThemedContent from "@/components/ThemedContent/ThemedContent";

type LayoutProps = { children?: React.ReactNode };

const FrontLayout = ({ children }: LayoutProps) => {
  // mobilní navigační zásuvka (nikoli uživatelská)
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);

  // postranní "uživatelská" zásuvka z provideru
  const { open: openAccountDrawer } = useContext(AccountDrawerContext);

  const pinned = useHeadroom({ fixedAt: 120 });
  const { data: session, status } = useSession();

  const isAuth = status === "authenticated";
  const role = session?.user?.role;

  const canSeeStudent = isAuth && role === Role.STUDENT;
  const canSeeTeacherOrAdmin = isAuth && (role === Role.TEACHER || role === Role.ADMIN);
  const canSeeAdmin = isAuth && role === Role.ADMIN;

  // helper: otevři user drawer jen přihlášenému
  const handleOpenAccount = () => {
    if (isAuth) {
      openAccountDrawer();
    } else {
      // volitelné: přesměruj na přihlášení
      // signIn();
    }
  };

  return (
    <AppShell
      header={{ height: 60, collapsed: !pinned, offset: true }}
      footer={{ height: 56, offset: true }}
      padding="md"
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" mx="sm">
          <Group justify="space-between" h="100%" mx="sm">
            <Link href="/">
              <MainLogo />
            </Link>
          </Group>

          {/* desktop navigace */}
          <Group h="100%" gap={0} visibleFrom="sm" className={styles.navigation}>
            {canSeeStudent && (
              <Link href="/my" className={styles.link}>
                Moje praxe
              </Link>
            )}
            <Link href="/companies" className={styles.link}>
              Firmy
            </Link>
            {canSeeTeacherOrAdmin && (
              <>
                <Link href="/internships" className={styles.link}>
                  Praxe
                </Link>
                <Link href="/inspections" className={styles.link}>
                  Aktuální praxe
                </Link>
              </>
            )}
            {canSeeAdmin && (
              <Link href="/dashboard" className={styles.link}>
                Administrace
              </Link>
            )}
          </Group>

          {/* pravá část headeru */}
          <Group>
            {/* desktop pravý blok */}
            <Flex visibleFrom="sm" gap="sm" align="center">
              {/* Avatar jen pokud je přihlášen */}
              {isAuth && (
                <UserAvatar
                  picture={
                    session?.user?.image
                      ? "data:image/jpeg;base64, " + session.user.image
                      : null
                  }
                  fullname={session?.user?.name}
                  email={session?.user?.email}
                  onClick={handleOpenAccount}
                />
              )}
              <ThemeIcon />
              <SignIcon hiddenFrom="md" />
              <SignButton visibleFrom="md" />
            </Flex>

            {/* mobilní pravý blok */}
            <Flex hiddenFrom="sm" gap="sm" align="center">
              {/* Mobilní avatar jen pro přihlášeného */}
              {isAuth && (
                <Avatar
                  src={
                    session?.user?.image
                      ? "data:image/jpeg;base64, " + session.user.image
                      : null
                  }
                  radius={40}
                  size={40}
                  onClick={handleOpenAccount}
                />
              )}
              <Burger opened={drawerOpened} onClick={toggleDrawer} />
            </Flex>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main className={styles.pageContent}>{children}</AppShell.Main>

      <AppShell.Footer className={styles.pageFooter}>
        <Container className={styles.innerFooter}>
          <Group>
            <Anchor href="https://www.pslib.cz/" target="_blank">
              Průmyslová škola Liberec
            </Anchor>
            <Anchor href="https://github.com/pslib-cz/pslib-internship-g4" target="_blank">
              GitHub
            </Anchor>
          </Group>
          <Text>{process.env.NEXT_PUBLIC_VERSION ?? ""}</Text>
          <Group>
            <Anchor href="https://www.pslib.cz/" target="_blank">
              <ThemedContent
                light={
                  <Image
                    src="/images/logos/pslib-large-light.svg"
                    alt="Průmyslová škola Liberec"
                    width={110}
                    height={20}
                    priority
                  />
                }
                dark={
                  <Image
                    src="/images/logos/pslib-large-dark.svg"
                    alt="Průmyslová škola Liberec"
                    width={110}
                    height={20}
                    priority
                  />
                }
              />
            </Anchor>
          </Group>
        </Container>
      </AppShell.Footer>

      {/* mobilní navigační zásuvka */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position="right"
        size="90%"
        padding="md"
        title="Navigace"
        hiddenFrom="sm"
        zIndex={500}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />
          {canSeeStudent && (
            <Link href="/my" className={styles.link} onClick={closeDrawer}>
              Moje praxe
            </Link>
          )}
          <Link href="/companies" className={styles.link} onClick={closeDrawer}>
            Firmy
          </Link>
          {canSeeTeacherOrAdmin && (
            <>
              <Link href="/internships" className={styles.link} onClick={closeDrawer}>
                Archiv
              </Link>
              <Link href="/inspections" className={styles.link} onClick={closeDrawer}>
                Aktuální praxe
              </Link>
            </>
          )}
          {canSeeAdmin && (
            <Link href="/dashboard" className={styles.link} onClick={closeDrawer}>
              Administrace
            </Link>
          )}
          <Divider my="sm" />
          <Group justify="center" grow pb="xl" px="md">
            <SignButton />
            <ThemeIcon />
          </Group>
        </ScrollArea>
      </Drawer>
    </AppShell>
  );
};

export default FrontLayout;