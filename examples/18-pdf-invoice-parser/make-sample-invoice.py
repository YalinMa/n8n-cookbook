#!/usr/bin/env python3
"""Generate sample-invoice.pdf (a fictional invoice) with no dependencies.

Usage: python3 make-sample-invoice.py
"""

LINES = [
    (18, "ACME Coffee Supplies GmbH"),
    (10, "Musterstrasse 1, 10115 Berlin, Germany"),
    (10, ""),
    (16, "INVOICE"),
    (11, "Invoice Number: INV-2026-0042"),
    (11, "Invoice Date: 2026-10-01"),
    (11, "Due Date: 2026-10-31"),
    (11, "Bill To: Cookbook Cafe Ltd, 12 Example Street, Berlin"),
    (11, ""),
    (11, "Description | Qty | Unit Price | Amount"),
    (11, "Espresso beans 1kg | 10 | 24.50 | 245.00"),
    (11, "Paper cups (pack of 100) | 5 | 8.90 | 44.50"),
    (11, "Oat milk 1L | 24 | 2.10 | 50.40"),
    (11, ""),
    (11, "Subtotal: 339.90 EUR"),
    (11, "VAT 19%: 64.58 EUR"),
    (13, "Total Due: 404.48 EUR"),
    (11, ""),
    (9, "Payment: bank transfer to IBAN DE00 0000 0000 0000 0000 00 (fictional example)"),
]


def escape(text):
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build():
    y = 780
    ops = []
    for size, text in LINES:
        if text:
            ops.append(f"BT /F1 {size} Tf 56 {y} Td ({escape(text)}) Tj ET")
        y -= size + 10
    stream = "\n".join(ops).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


if __name__ == "__main__":
    with open("sample-invoice.pdf", "wb") as f:
        f.write(build())
    print("wrote sample-invoice.pdf")
