from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate_credit_note_pdf(credit_note) -> bytes:
    """Génère le document PDF d'un avoir à l'aide de ReportLab."""
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

    PRIMARY_COLOR = colors.HexColor('#DC2626') # Red / Credit Accent
    SECONDARY_BG = colors.HexColor('#FEF2F2')
    TEXT_COLOR = colors.HexColor('#1E293B')

    title_style = ParagraphStyle(
        'DocTitleCN',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=PRIMARY_COLOR,
        spaceAfter=4
    )

    meta_style = ParagraphStyle(
        'DocMetaCN',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#64748B'),
        leading=12
    )

    h2_style = ParagraphStyle(
        'H2StyleCN',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=PRIMARY_COLOR,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustomCN',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=TEXT_COLOR,
        leading=13
    )

    invoice = credit_note.parent_invoice
    company = getattr(credit_note, 'company', None) or (invoice.company if invoice else None)
    customer = getattr(credit_note, 'customer', None) or (invoice.customer if invoice else None)

    rccm_val = getattr(company, 'rccm', None) or 'N/A'
    company_info = [
        Paragraph(f"<b>{company.raison_sociale if company else 'N/A'}</b>", title_style),
        Paragraph(f"NIF: {(company.nif if company else None) or 'N/A'} | RCCM: {rccm_val}", meta_style),
        Paragraph(f"Adresse: {(company.address if company else None) or 'N/A'}", meta_style),
        Paragraph(f"Tél: {(company.phone if company else None) or 'N/A'} | Email: {(company.email if company else None) or 'N/A'}", meta_style),
    ]

    doc_status_str = f"AVOIR {credit_note.number}" if credit_note.number != 'BROUILLON' else "AVOIR / BROUILLON"
    etva_status_func = getattr(credit_note, 'get_etva_status_display', None)
    etva_status_str = etva_status_func() if callable(etva_status_func) else getattr(credit_note, 'status', 'BROUILLON')

    doc_info = [
        Paragraph(f"<b>{doc_status_str}</b>", ParagraphStyle('RightTitle', parent=title_style, alignment=2)),
        Paragraph(f"Ref Facture Origine: <b>{invoice.number if invoice else 'N/A'}</b>", ParagraphStyle('RMeta1', parent=meta_style, alignment=2)),
        Paragraph(f"Date d'émission: {credit_note.date.strftime('%d/%m/%Y')}", ParagraphStyle('RMeta2', parent=meta_style, alignment=2)),
        Paragraph(f"Statut eTVA: {etva_status_str}", ParagraphStyle('RMeta3', parent=meta_style, alignment=2)),
    ]

    header_table = Table([[company_info, doc_info]], colWidths=[10.5 * cm, 7.5 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY_COLOR, spaceBefore=0, spaceAfter=15))

    # Reason Box
    reason_text = getattr(credit_note, 'reason', None) or "Avoir suite à régularisation"
    reason_data = [
        [Paragraph(f"<b>MOTIF DE L'AVOIR :</b> {reason_text}", body_style)]
    ]
    reason_table = Table(reason_data, colWidths=[18 * cm])
    reason_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SECONDARY_BG),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FCA5A5')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(reason_table)
    story.append(Spacer(1, 0.5 * cm))

    # Line Items Table
    table_data = [
        [
            Paragraph("<b>Désignation</b>", body_style),
            Paragraph("<b>Qté</b>", ParagraphStyle('C1', parent=body_style, alignment=1)),
            Paragraph("<b>Prix Unit. HT</b>", ParagraphStyle('C2', parent=body_style, alignment=2)),
            Paragraph("<b>TVA</b>", ParagraphStyle('C3', parent=body_style, alignment=1)),
            Paragraph("<b>Total HT</b>", ParagraphStyle('C4', parent=body_style, alignment=2)),
        ]
    ]

    for item in credit_note.items.all():
        desc_val = getattr(item, 'description', None)
        desc = f"<br/><font size=8 color='#64748B'>{desc_val}</font>" if desc_val else ""
        table_data.append([
            Paragraph(f"{item.designation}{desc}", body_style),
            Paragraph(f"{item.quantity:g}", ParagraphStyle('Q', parent=body_style, alignment=1)),
            Paragraph(f"{item.unit_price:,.2f} GNF", ParagraphStyle('P', parent=body_style, alignment=2)),
            Paragraph(f"{getattr(item, 'vat_rate', 18):g}%", ParagraphStyle('V', parent=body_style, alignment=1)),
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
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FEF2F2')]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.5 * cm))

    # Totals Summary Box
    totals_data = [
        [Paragraph("Total HT Avoir :", body_style), Paragraph(f"<b>{credit_note.total_ht:,.2f} GNF</b>", ParagraphStyle('TH', parent=body_style, alignment=2))],
        [Paragraph("TVA Avoir :", body_style), Paragraph(f"<b>{credit_note.total_tva:,.2f} GNF</b>", ParagraphStyle('TT', parent=body_style, alignment=2))],
        [Paragraph("<b>TOTAL TTC AVOIR :</b>", h2_style), Paragraph(f"<b><font size=12 color='#DC2626'>{credit_note.total_ttc:,.2f} GNF</font></b>", ParagraphStyle('TTC', parent=body_style, alignment=2))],
    ]
    totals_table = Table(totals_data, colWidths=[4.5 * cm, 4.0 * cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, PRIMARY_COLOR),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))

    wrapper_table = Table([[Paragraph("", body_style), totals_table]], colWidths=[9.5 * cm, 8.5 * cm])
    wrapper_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    story.append(wrapper_table)

    doc.build(story)
    return buffer.getvalue()
