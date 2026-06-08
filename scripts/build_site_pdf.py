from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "XP-Tracker-Documento-do-Site.pdf"

YELLOW = colors.HexColor("#FACC15")
AMBER = colors.HexColor("#D97706")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#E5E7EB")
GREEN = colors.HexColor("#059669")
BLUE = colors.HexColor("#2563EB")
BLACK = colors.HexColor("#000000")


def register_fonts():
    fonts = {
        "AppRegular": r"C:\Windows\Fonts\arial.ttf",
        "AppBold": r"C:\Windows\Fonts\arialbd.ttf",
        "AppItalic": r"C:\Windows\Fonts\ariali.ttf",
    }
    for name, path in fonts.items():
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
    return "AppRegular", "AppBold", "AppItalic"


FONT, FONT_BOLD, FONT_ITALIC = register_fonts()


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            "CoverKicker",
            fontName=FONT_BOLD,
            fontSize=10,
            leading=12,
            textColor=AMBER,
            alignment=TA_CENTER,
            spaceAfter=10,
        )
    )
    base.add(
        ParagraphStyle(
            "CoverTitle",
            fontName=FONT_BOLD,
            fontSize=34,
            leading=38,
            textColor=INK,
            alignment=TA_CENTER,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            "CoverSubtitle",
            fontName=FONT,
            fontSize=14,
            leading=18,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=22,
        )
    )
    base.add(
        ParagraphStyle(
            "H1",
            fontName=FONT_BOLD,
            fontSize=16,
            leading=20,
            textColor=INK,
            spaceBefore=12,
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            "H2",
            fontName=FONT_BOLD,
            fontSize=12,
            leading=15,
            textColor=AMBER,
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            "AppBody",
            fontName=FONT,
            fontSize=10.2,
            leading=14,
            textColor=INK,
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            "Small",
            fontName=FONT,
            fontSize=8.7,
            leading=11,
            textColor=MUTED,
        )
    )
    base.add(
        ParagraphStyle(
            "BulletText",
            fontName=FONT,
            fontSize=10,
            leading=13,
            leftIndent=13,
            firstLineIndent=-8,
            textColor=INK,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            "TableHead",
            fontName=FONT_BOLD,
            fontSize=8.5,
            leading=10,
            textColor=YELLOW,
        )
    )
    base.add(
        ParagraphStyle(
            "TableText",
            fontName=FONT,
            fontSize=9.2,
            leading=12,
            textColor=INK,
        )
    )
    base.add(
        ParagraphStyle(
            "TableLabel",
            fontName=FONT_BOLD,
            fontSize=9.2,
            leading=12,
            textColor=INK,
        )
    )
    base.add(
        ParagraphStyle(
            "CalloutTitle",
            fontName=FONT_BOLD,
            fontSize=10.5,
            leading=13,
            textColor=INK,
            spaceAfter=3,
        )
    )
    return base


S = styles()


def p(text, style="AppBody"):
    return Paragraph(text, S[style])


def bullet(text):
    return Paragraph(f"• {text}", S["BulletText"])


def status_table():
    data = [
        [p("PRODUTO", "TableHead"), p("INFRAESTRUTURA", "TableHead"), p("STATUS", "TableHead")],
        [
            p("<b>XP Tracker</b>", "TableText"),
            p("Cloudflare Pages + Supabase + Mercado Pago", "TableText"),
            p("<b>Build 0.9.16</b>", "TableText"),
        ],
    ]
    table = Table(data, colWidths=[1.75 * inch, 3.05 * inch, 1.45 * inch], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK),
                ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def two_col(rows, left="Área", right="Como o XP Tracker trata"):
    data = [[p(left, "TableHead"), p(right, "TableHead")]]
    for label, detail in rows:
        data.append([p(label, "TableLabel"), p(detail, "TableText")])
    table = Table(data, colWidths=[1.55 * inch, 4.75 * inch], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK),
                ("BACKGROUND", (0, 1), (0, -1), LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def callout(title, body, fill=colors.HexColor("#FFFBEB"), border=AMBER):
    data = [[p(title, "CalloutTitle")], [p(body, "TableText")]]
    table = Table(data, colWidths=[6.3 * inch], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 1, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(inch, 0.45 * inch, "XP Tracker | Documento do site | Lira Labs")
    canvas.drawRightString(letter[0] - inch, 0.45 * inch, f"Página {doc.page}")
    canvas.restoreState()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=0.9 * inch,
        bottomMargin=0.75 * inch,
        title="XP Tracker - Documento do Site",
        author="Lira Labs",
        subject="Produto, recursos, segurança e LGPD do XP Tracker",
    )

    story = []
    story += [
        Spacer(1, 0.45 * inch),
        p("LIRA LABS", "CoverKicker"),
        p("XP TRACKER", "CoverTitle"),
        p("Acompanhe XP, runs e evolução do seu personagem", "CoverSubtitle"),
        status_table(),
        Spacer(1, 0.22 * inch),
        p(
            "Documento institucional para apresentar o produto, seus recursos principais, infraestrutura, tratamento de dados e camadas de segurança.",
            "AppBody",
        ),
        Spacer(1, 0.12 * inch),
        callout(
            "Resumo executivo",
            "O XP Tracker é um painel premium para organização de progresso de XP, histórico, runs, metas, gráficos e assinatura. O produto usa Google/Supabase para conta e dados, Cloudflare para hospedagem/backend e Mercado Pago para pagamentos.",
        ),
        PageBreak(),
        p("1. O que é o XP Tracker", "H1"),
        p(
            "O XP Tracker é uma aplicação web criada para jogadores acompanharem a evolução do personagem de forma simples, visual e persistente. O objetivo é transformar XP restante, XP total, runs, mortes, metas e histórico em uma visão diária de progresso.",
        ),
        p(
            "A ferramenta não substitui fontes oficiais do jogo. Ela organiza os dados que o usuário informa e os valores cadastrados no sistema para facilitar decisões de farm e acompanhamento.",
        ),
        p("2. Principais recursos", "H1"),
    ]
    for item in [
        "Painel de progresso com nível atual, próximo nível, XP do usuário, XP para upar, XP restante e percentual de progresso.",
        "Registro rápido de runs de criptas e masmorras, considerando cripta, quantidade de jogadores, nível e XP cadastrado.",
        "Histórico inteligente com registros de XP, ajustes manuais, mortes, boosts, runs e saldo por data.",
        "Gráficos e consulta por data para visualizar ganho, perda, saldo do dia e evolução no período.",
        "Sistema de morte para registrar perda de XP com ou sem Colar da Paz.",
        "Boost de Double XP para caçadas ou masmorras, refletindo nos valores antes do registro.",
        "Jornada de conquistas, marcos de farm, selos de perfil e acompanhamento de metas.",
        "Plano Premium com teste grátis, cupons, Pix, cartão e validação de pagamento.",
        "Caixa de Sugestão para coletar feedback dos usuários dentro do produto.",
    ]:
        story.append(bullet(item))

    story += [
        PageBreak(),
        p("3. Fluxo de uso", "H1"),
        two_col(
            [
                ("Primeiro acesso", "O usuário informa nível, XP restante, XP total e meta diária para iniciar o acompanhamento."),
                ("Login", "O acesso pode ocorrer como visitante ou com Google. Visitante testa sem salvar na nuvem; Google permite sincronização no Supabase."),
                ("Registro diário", "O usuário registra runs, ajustes manuais, mortes e boosts conforme joga."),
                ("Análise", "O painel calcula progresso, histórico, gráficos, resultado do dia e estimativas para upar."),
                ("Premium", "Após o teste grátis de 3 dias, recursos de sincronização e acesso completo podem depender de assinatura."),
            ],
            "Etapa",
            "Funcionamento",
        ),
        Spacer(1, 0.16 * inch),
        p("4. Dados tratados", "H1"),
        two_col(
            [
                ("Conta", "Nome, e-mail, avatar e identificador técnico do usuário autenticado pelo Google/Supabase."),
                ("Progresso", "Nível, XP restante, XP total, meta diária, histórico, runs, mortes, boosts e ajustes manuais."),
                ("Assinatura", "Plano, status, trial, cupom, período, valor e identificadores técnicos de pagamento."),
                ("Sugestões", "Mensagens enviadas voluntariamente pela Caixa de Sugestão."),
            ],
            "Categoria",
            "Dados",
        ),
        Spacer(1, 0.16 * inch),
        callout(
            "Privacidade no produto",
            "O XP Tracker possui páginas públicas de Política de Privacidade e Termos de Uso, aviso antes do login e documentação interna de operação LGPD.",
            fill=colors.HexColor("#ECFDF5"),
            border=GREEN,
        ),
        PageBreak(),
        p("5. Segurança e proteção", "H1"),
        two_col(
            [
                ("Autenticação", "Login com Google via Supabase Auth, com sessão persistente e fluxo PKCE."),
                ("Banco de dados", "Supabase com Row Level Security para isolar dados por usuário nas tabelas sensíveis."),
                ("Segredos", "Service role do Supabase e token do Mercado Pago ficam nas Cloudflare Functions, fora do front-end."),
                ("Pagamentos", "Checkout criado no backend e plano liberado somente após confirmação por webhook."),
                ("Cartão e Pix", "Dados completos de cartão, senha bancária e chave Pix não são armazenados pelo XP Tracker."),
                ("Admin", "Painel administrativo restrito ao superadmin e apoiado por função/RPC no Supabase."),
                ("Interface", "Camadas de bloqueio de atalhos, impressão e inspeção dificultam captura casual, sem prometer proteção absoluta contra cópia do front-end."),
            ],
            "Camada",
            "Proteção aplicada",
        ),
        Spacer(1, 0.16 * inch),
        p("6. Infraestrutura e fornecedores", "H1"),
        two_col(
            [
                ("Google", "Login social e dados básicos do perfil."),
                ("Supabase", "Autenticação, banco de dados, Row Level Security e sincronização."),
                ("Cloudflare", "Hospedagem do site, entrega global, HTTPS e Pages Functions."),
                ("Mercado Pago", "Checkout, Pix, cartão, status de pagamento e webhook."),
            ],
            "Fornecedor",
            "Uso no XP Tracker",
        ),
        PageBreak(),
        p("7. LGPD e transparência", "H1"),
    ]
    for item in [
        "Política de Privacidade e Termos de Uso publicados no site.",
        "Aviso de privacidade visível antes do login.",
        "Registro interno de fornecedores e documentos de privacidade/DPA.",
        "Rotina operacional para pedidos de acesso, correção e exclusão de dados.",
        "Sem cookies de publicidade, pixels ou analytics de terceiros no momento.",
        "Exclusão de conta prevista no painel e retenção limitada ao necessário para operação, segurança e obrigações legais.",
    ]:
        story.append(bullet(item))
    story += [
        Spacer(1, 0.18 * inch),
        p("8. Limites e responsabilidades", "H1"),
        p(
            "Como todo site, o front-end entregue ao navegador pode ser inspecionado por usuários técnicos. A proteção real está em manter segredos, pagamentos, permissões e regras críticas no backend e no banco com RLS.",
        ),
        p(
            "Os cálculos dependem dos dados cadastrados e das informações inseridas pelo usuário. Alterações futuras do jogo podem exigir revisão dos valores de XP e regras internas.",
        ),
        p("9. Links úteis", "H1"),
        two_col(
            [
                ("Site", "https://xp-tracker.pages.dev"),
                ("Política de Privacidade", "https://xp-tracker.pages.dev/privacidade"),
                ("Termos de Uso", "https://xp-tracker.pages.dev/termos"),
                ("Teletofus", "https://teletofus.com"),
            ],
            "Item",
            "Endereço",
        ),
        Spacer(1, 0.16 * inch),
        callout(
            "Estado atual",
            "Documento preparado para a build 0.9.16, antes do lançamento público planejado. Futuras mudanças de domínio, e-mail oficial, fornecedores ou analytics devem atualizar este material.",
            fill=colors.HexColor("#EFF6FF"),
            border=BLUE,
        ),
    ]

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT)


if __name__ == "__main__":
    build()
