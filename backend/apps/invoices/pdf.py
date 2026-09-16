from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_invoice_pdf(invoice) -> bytes:
    """Génère le document PDF d'une facture à l'aide de ReportLab."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm
    )

    story = []
    styles = getSampleStyleSheet()

    # Define custom palette matching Slate Ocean theme (#2F4858)
    PRIMARY_COLOR = colors.HexColor('#2F4858')
    SECONDARY_BG = colors.HexColor('#F8FAFC')
    ACCENT_COLOR = colors.HexColor('#0EA5E9')
    TEXT_COLOR = colors.HexColor('#1E293B')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=PRIMARY_COLOR,
        spaceAfter=4
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#64748B'),
        leading=12
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=PRIMARY_COLOR,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=TEXT_COLOR,
        leading=13
    )

    company = invoice.company
    customer = invoice.customer

    # Header Row: Company Info (Left) vs Document Info (Right)
    company_info = [
        Paragraph(f"<b>{company.raison_sociale}</b>", title_style),
        Paragraph(f"NIF: {company.nif} | RCCM: {company.rccm or 'N/A'}", meta_style),
        Paragraph(f"Adresse: {company.address}", meta_style),
        Paragraph(f"Tél: {company.phone} | Email: {company.email}", meta_style),
    ]

    doc_status_str = f"FACTURE {invoice.number}" if invoice.number != 'BROUILLON' else "PROFORMA / BROUILLON"
    doc_info = [
        Paragraph(f"<b>{doc_status_str}</b>", ParagraphStyle('RightTitle', parent=title_style, alignment=2)),
        Paragraph(f"Date d'émission: {invoice.date.strftime('%d/%m/%Y')}", ParagraphStyle('RMeta1', parent=meta_style, alignment=2)),
        Paragraph(f"Date d'échéance: {invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'Réception'}", ParagraphStyle('RMeta2', parent=meta_style, alignment=2)),
        Paragraph(f"Statut eTVA: {invoice.get_etva_status_display()}", ParagraphStyle('RMeta3', parent=meta_style, alignment=2)),
    ]

    header_table = Table([[company_info, doc_info]], colWidths=[10.5 * cm, 7.5 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY_COLOR, spaceBefore=0, spaceAfter=15))

    # Customer Block Box
    customer_data = [
        [Paragraph("<b>FACTURÉ À :</b>", h2_style)],
        [Paragraph(f"<b>{customer.name}</b>", body_style)],
        [Paragraph(f"NIFp Client: <b>{customer.nifp or 'Non renseigné'}</b>", body_style)],
        [Paragraph(f"Adresse: {customer.address or 'N/A'} {customer.city or ''}", body_style)],
        [Paragraph(f"Contact: {customer.phone or ''} {customer.email or ''}", body_style)]
    ]
    customer_table = Table(customer_data, colWidths=[18 * cm])
    customer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SECONDARY_BG),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(customer_table)
    story.append(Spacer(1, 0.6 * cm))

    # Line Items Table Header & Rows
    table_data = [
        [
            Paragraph("<b>Désignation</b>", body_style),
            Paragraph("<b>Qté</b>", ParagraphStyle('C1', parent=body_style, alignment=1)),
            Paragraph("<b>Prix Unit. HT</b>", ParagraphStyle('C2', parent=body_style, alignment=2)),
            Paragraph("<b>TVA</b>", ParagraphStyle('C3', parent=body_style, alignment=1)),
            Paragraph("<b>Total HT</b>", ParagraphStyle('C4', parent=body_style, alignment=2)),
        ]
    ]

    for item in invoice.items.all():
        desc = f"<br/><font size=8 color='#64748B'>{item.description}</font>" if item.description else ""
        table_data.append([
            Paragraph(f"{item.designation}{desc}", body_style),
            Paragraph(f"{item.quantity:g}", ParagraphStyle('Q', parent=body_style, alignment=1)),
            Paragraph(f"{item.unit_price:,.2f} GNF", ParagraphStyle('P', parent=body_style, alignment=2)),
            Paragraph(f"{item.vat_rate:g}%", ParagraphStyle('V', parent=body_style, alignment=1)),
            Paragraph(f"{item.line_total_ht:,.2f} GNF", ParagraphStyle('T', parent=body_style, alignment=2)),
        ])

    items_table = Table(table_data, colWidths=[7.5 * cm, 1.8 * cm, 3.2 * cm, 1.8 * cm, 3.7 * cm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.5 * cm))

    # Totals Summary Box
    totals_data = [
        [Paragraph("Total HT :", body_style), Paragraph(f"<b>{invoice.total_ht:,.2f} GNF</b>", ParagraphStyle('TH', parent=body_style, alignment=2))],
        [Paragraph("TVA :", body_style), Paragraph(f"<b>{invoice.total_tva:,.2f} GNF</b>", ParagraphStyle('TT', parent=body_style, alignment=2))],
        [Paragraph("<b>TOTAL TTC :</b>", h2_style), Paragraph(f"<b><font size=12 color='#2F4858'>{invoice.total_ttc:,.2f} GNF</font></b>", ParagraphStyle('TTC', parent=body_style, alignment=2))],
    ]
    totals_table = Table(totals_data, colWidths=[4.0 * cm, 4.5 * cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, PRIMARY_COLOR),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))

    # Wrap in container to right-align totals table
    wrapper_table = Table([[Paragraph("", body_style), totals_table]], colWidths=[9.5 * cm, 8.5 * cm])
    wrapper_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story.append(wrapper_table)
    story.append(Spacer(1, 0.8 * cm))

    # Legal mentions and payment instructions
    if invoice.payment_conditions or invoice.payment_instructions or invoice.legal_mentions:
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=10))
        if invoice.payment_conditions:
            story.append(Paragraph(f"<b>Conditions de règlement :</b> {invoice.payment_conditions}", meta_style))
        if invoice.payment_instructions:
            story.append(Paragraph(f"<b>Instructions de paiement :</b> {invoice.payment_instructions}", meta_style))
        if invoice.legal_mentions:
            story.append(Paragraph(f"<b>Mentions légales :</b> {invoice.legal_mentions}", meta_style))

    doc.build(story)
    return buffer.getvalue()
