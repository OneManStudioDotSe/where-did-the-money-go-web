# CSV Format Specification

This document describes the expected CSV format for Swedish bank exports and how the application handles parsing.

---

## Supported Format: Swedish Bank Export (Swedbank/SEB style)

### File Characteristics

| Property | Value |
|----------|-------|
| Encoding | UTF-8 (often with BOM) |
| Delimiter | Semicolon (`;`) |
| Line ending | CRLF or LF |
| Header row | Yes |
| Decimal separator | Period (`.`) |

### Column Structure

| # | Swedish Header | English | Type | Required |
|---|---------------|---------|------|----------|
| 1 | Bokföringsdatum | Booking Date | Date (YYYY-MM-DD) | ✓ |
| 2 | Valutadatum | Value Date | Date (YYYY-MM-DD) | ✗ |
| 3 | Verifikationsnummer | Transaction ID | String | ✗ |
| 4 | Text | Description | String | ✓ |
| 5 | Belopp | Amount | Decimal | ✓ |
| 6 | Saldo | Balance | Decimal | ✗ |

### Amount Convention

- **Negative values** = Expenses (money going out)
- **Positive values** = Income (money coming in)

### Description Format Patterns

The `Text` field often follows these patterns:

```
MERCHANT NAME/YY-MM-DD       # Standard purchase
MERCHANT     /YY-MM-DD       # Padded with spaces
K*ONLINE.STORE               # Klarna purchase (K*)
MERCHANT NAME                # No date suffix
```

### Example Rows

```csv
Bokföringsdatum;Valutadatum;Verifikationsnummer;Text;Belopp;Saldo
2025-12-18;2025-12-18;5484381424;NETFLIX COM /25-12-18;-149.000;8686.500
2025-12-18;2025-12-18;5490990527;RASMUS STELL;813.000;9150.450
2025-11-28;2025-11-28;9900003100;BERGNÄS;-7000.000;38640.490
```

---

## Column Detection Heuristics

The application will attempt to auto-detect columns using these rules:

### Date Column Detection
- Contains values matching `YYYY-MM-DD` pattern
- Header contains: `datum`, `date`, `dag`
- All values are valid dates

### Amount Column Detection
- Contains numeric values (possibly with decimals)
- Has mix of positive and negative values
- Header contains: `belopp`, `amount`, `summa`, `kostnad`

### Description Column Detection
- Contains string/text values
- Longest average character count
- Header contains: `text`, `beskrivning`, `description`, `meddelande`

### Balance Column Detection
- Contains numeric values
- Values are generally larger than amounts
- Header contains: `saldo`, `balance`

---

## Common Swedish Bank Patterns

### Merchant Name Variations

| Pattern | Example | Meaning |
|---------|---------|---------|
| `K*` prefix | K*APOTEA.SE | Klarna purchase |
| `/YY-MM-DD` suffix | NETFLIX COM /25-12-18 | Transaction date |
| Padded spaces | `SL          ` | Normalized merchant name |
| Numbers in name | LIDL258STHLM | Store identifier |

### Common Recurring Transactions

Based on analysis, these patterns indicate subscriptions:

| Merchant Pattern | Category | Typical Amount |
|-----------------|----------|----------------|
| NETFLIX COM | Entertainment/Streaming | ~149 SEK |
| SPOTIFY P* | Entertainment/Streaming | ~169-189 SEK |
| GOOGLE ONE | Technology/Cloud Storage | ~249 SEK |
| TRYGG-HANSA | Insurance | ~633-760 SEK |
| SECTOR ALARM | Home/Security | ~547 SEK |

### Loan Payments

Pattern: `LÅN` or `LÃN` followed by account number
Example: `LÃN 47042623`

### Utility Bills

Pattern: Full company name
Examples:
- `VATTENFALL KUNDSERVICE A` (Electricity)
- `TELENOR SVERIGE AB` (Phone)
- `HUDDINGE KOMMUN` (Municipal fees)

---

## Encoding Considerations

### BOM Handling
Swedish bank exports often include a UTF-8 BOM (`\uFEFF`). The parser should:
1. Detect and strip BOM if present
2. Handle both with and without BOM

### Swedish Characters
Common Swedish characters that must be preserved:
- `å`, `ä`, `ö` (lowercase)
- `Å`, `Ä`, `Ö` (uppercase)

Note: Some exports may have encoding issues showing as:
- `Ã…` instead of `Å`
- `Ã¤` instead of `ä`
- `Ã¶` instead of `ö`

The parser should attempt to fix common encoding corruptions.

---

## Future Bank Support

### Nordea
- Similar structure
- May use comma delimiter
- Different column names

### Handelsbanken
- Tab-delimited option
- Different date format possible

### SEB
- Very similar to Swedbank
- Some column name variations

---

## Validation Rules

### Required Fields
1. At least one date column
2. Exactly one amount column
3. At least one description column

### Data Quality Checks
- Date values are valid dates
- Amount values are numeric
- No completely empty rows
- Consistent column count per row

### Error Handling
If validation fails, the user should be prompted to:
1. Manually map columns
2. Specify delimiter
3. Confirm date format
