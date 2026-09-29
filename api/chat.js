export default async function handler(req, res) {

    // =========================================
    // A5 AI - Backend
    // =========================================

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        // =====================================
        // استقبال البيانات من a5.html
        // =====================================

        const {
            message,
            messages = [],
            memory = "",
            system = "",
            language = "ar"
        } = req.body || {};


        // =====================================
        // التحقق من الرسالة
        // =====================================

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {

            return res.status(400).json({
                error: "الرسالة فارغة."
            });

        }


        // =====================================
        // API KEY
        // =====================================

        const API_KEY =
            process.env.AI_API_KEY;


        if (!API_KEY) {

            return res.status(500).json({
                error:
                    "AI_API_KEY غير موجود في متغيرات البيئة."
            });

        }


        // =====================================
        // شخصية A5
        // =====================================

        const defaultSystem = `
أنت A5، مساعد ذكاء اصطناعي متطور.

قواعدك:

1. افهم السؤال قبل الإجابة.
2. لا توافق المستخدم لمجرد إرضائه.
3. إذا كانت فكرته ضعيفة، وضح لماذا.
4. انتقد الأفكار وليس الأشخاص.
5. كن مباشرًا وواضحًا.
6. عند البرمجة، قدم حلولًا عملية وكودًا صحيحًا.
7. لا تدّعي أنك نفذت شيئًا لم تنفذه.
8. إذا كنت غير متأكد من معلومة، صرّح بذلك.
9. استخدم لغة المستخدم.
10. حافظ على إجابات مفيدة ومنظمة.
`;


        const systemPrompt =
            system ||
            defaultSystem;


        // =====================================
        // بناء المحادثة
        // =====================================

        const conversation = [];


        conversation.push({
            role: "system",
            content: systemPrompt
        });


        // =====================================
        // الذاكرة
        // =====================================

        if (
            memory &&
            typeof memory === "string"
        ) {

            conversation.push({
                role: "system",
                content:
                    `
هذه معلومات من ذاكرة المحادثات السابقة.
استخدمها فقط عندما تكون مرتبطة بالسؤال الحالي:

${memory}
`
            });

        }


        // =====================================
        // آخر رسائل المحادثة
        // =====================================

        if (
            Array.isArray(messages)
        ) {

            const safeMessages =
                messages
                    .filter(item =>
                        item &&
                        (
                            item.role === "user" ||
                            item.role === "assistant"
                        ) &&
                        typeof item.content === "string"
                    )
                    .slice(-30);


            for (
                const item of safeMessages
            ) {

                conversation.push({

                    role:
                        item.role,

                    content:
                        item.content.slice(
                            0,
                            12000
                        )

                });

            }

        }


        // =====================================
        // ضمان وجود الرسالة الحالية
        // =====================================

        const lastMessage =
            conversation[
                conversation.length - 1
            ];


        if (
            !lastMessage ||
            lastMessage.content !== message
        ) {

            conversation.push({

                role:
                    "user",

                content:
                    message.trim()

            });

        }


        // =====================================
        // الاتصال بنموذج AI
        // =====================================

        const response =
            await fetch(
                "https://api.openai.com/v1/chat/completions",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${API_KEY}`

                    },

                    body:
                        JSON.stringify({

                            model:
                                process.env.AI_MODEL ||
                                "gpt-4o-mini",

                            messages:
                                conversation,

                            temperature:
                                0.7,

                            max_tokens:
                                3000

                        })

                }
            );


        // =====================================
        // قراءة استجابة AI
        // =====================================

        const data =
            await response.json();


        if (
            !response.ok
        ) {

            console.error(
                "AI API Error:",
                data
            );


            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "حدث خطأ أثناء الاتصال بنموذج AI."

            });

        }


        // =====================================
        // استخراج الإجابة
        // =====================================

        const reply =
            data?.choices?.[0]?.message?.content;


        if (
            !reply
        ) {

            return res.status(500).json({

                error:
                    "لم يرجع النموذج إجابة."

            });

        }


        // =====================================
        // إرسال الإجابة إلى A5
        // =====================================

        return res.status(200).json({

            reply:
                reply,

            model:
                data?.model ||
                process.env.AI_MODEL ||
                "unknown",

            language:
                language

        });


    } catch (error) {

        console.error(
            "A5 Backend Error:",
            error
        );


        return res.status(500).json({

            error:
                "حدث خطأ داخلي في خادم A5."

        });

    }

}
