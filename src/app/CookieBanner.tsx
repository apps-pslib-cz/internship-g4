"use client";

import { Button, CloseButton, Group, Paper, Text } from "@mantine/core";
import { useState, useEffect } from "react";

const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export const CookiesBanner = () => {
  const [visible, setVisible] = useState(false);

  const initClarity = (
    window: any,
    document: any,
    clarityKey: string,
    script: any,
    clarityId: any,
  ) => {
    window[clarityKey] =
      window[clarityKey] ||
      function () {
        (window[clarityKey].q = window[clarityKey].q || []).push(arguments);
      };
    const tag = document.createElement(script);
    tag.async = true;
    tag.src = `https://www.clarity.ms/tag/${clarityId}`;
    const firstScript = document.getElementsByTagName(script)[0];
    firstScript.parentNode.insertBefore(tag, firstScript);
    console.info("Clarity analytics initiated...");
  };

  const initUmami = (document: any, url: string, websiteId: string) => {
    const tag = document.createElement("script");
    tag.async = true;
    tag.defer = true;
    tag.src = `${url.replace(/\/$/, "")}/script.js`;
    tag.setAttribute("data-website-id", websiteId);
    document.body.appendChild(tag);
    console.info("Umami analytics initiated...");
  };

  const initAnalytics = (window: any, document: any) => {
    if (clarityId) {
      initClarity(window, document, "clarity", "script", clarityId);
    }
    if (umamiUrl && umamiWebsiteId) {
      initUmami(document, umamiUrl, umamiWebsiteId);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const consentGiven = document.cookie.includes("analytics_consent=true");
    setVisible(!consentGiven);
    if (consentGiven) {
      initAnalytics(window, document);
    }
  }, []);

  const handleAccept = () => {
    document.cookie = "analytics_consent=true; path=/; max-age=31536000"; // 1 rok
    setVisible(false);
    initAnalytics(window, document);
  };

  const handlePreferences = () => {
    alert("Zde můžete přidat preference cookies.");
  };

  return (
    <>
      {visible ? (
        <Paper
          withBorder
          p="lg"
          radius="md"
          shadow="md"
          style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
        >
          <Group mb="xs">
            <Text size="md">Použití cookies</Text>
            <CloseButton onClick={() => setVisible(false)} />
          </Group>
          <Text c="dimmed" size="xs">
            Tento web používá cookies ke zlepšení uživatelského zážitku.
          </Text>
          <Group mt="sm">
            <Button variant="outline" size="xs" onClick={handleAccept}>
              Přijmout vše
            </Button>
          </Group>
        </Paper>
      ) : null}
    </>
  );
};

export default CookiesBanner;
