"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Title, Box, Alert, Button, Group, Text } from "@mantine/core";
import { IconDownload, IconPrinter, IconPdf } from "@tabler/icons-react";
import { useReactToPrint } from "react-to-print";
// ❌ odstraněno: import html2pdf from "html2pdf.js";

type ConclusionDownloadProps = { internshipId: string };

const ConclusionDownload: FC<ConclusionDownloadProps> = ({ internshipId }) => {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [shouldGeneratePdf, setShouldGeneratePdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrintContentLoad = useCallback(() => {
    fetch(`/api/internships/${internshipId}/conclusion/print`)
      .then((r) => r.text())
      .then(setContent)
      .catch(setError as any);
  }, [internshipId]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const r = await fetch(`/api/internships/${internshipId}/conclusion/print`);
      const data = await r.text();
      setContent(data);
      setShouldGeneratePdf(true);
    } catch (e) {
      if (e instanceof Error) setError(e);
    }
  }, [internshipId]);

  useEffect(() => {
    if (!shouldGeneratePdf || !contentRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        setIsGenerating(true);
        // ⬇️ dynamický import jen v prohlížeči
        const html2pdf = (await import("html2pdf.js")).default;

        const element = contentRef.current!;
        const opt = {
          margin: 0.5,
          filename: "zaverecna-zprava.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
        };

        if (!cancelled) {
          await html2pdf().set(opt).from(element).save();
        }
      } catch (e) {
        if (e instanceof Error) setError(e);
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
          setShouldGeneratePdf(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [shouldGeneratePdf, content]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Závěrečná zpráva z praxe",
  });

  return (
    <>
      <Title order={3}>Závěrečná zpráva z praxe</Title>
      <Text>Tento dokument obsahuje shrnutí praxe a hodnocení studenta.</Text>
      {error && <Alert color="red">{error.message}</Alert>}
      <Box>
        <Group mt="1em">
          <Button
            variant="filled"
            leftSection={<IconPrinter />}
            onClick={() => { handlePrintContentLoad(); handlePrint(); }}
          >
            Tisk
          </Button>
          <Button
            variant="default"
            leftSection={<IconPdf />}
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            loading={isGenerating}
          >
            .pdf
          </Button>
          <Button
            leftSection={<IconDownload />}
            onClick={(e) => {
              e.preventDefault();
              window.open(
                `/api/internships/${internshipId}/conclusion/print`,
                "_blank",
              );
            }}
            variant="default"
          >
            .html
          </Button>
        </Group>
      </Box>
      <div style={{ height: 0, overflow: "hidden", width: 0 }}>
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </>
  );
};

export default ConclusionDownload;