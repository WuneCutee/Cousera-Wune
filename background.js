/**
 * COURSERA AUTOMATION - BACKGROUND SCRIPT
 * Version: 2.5 (Fix Submit Failed & Quota)
 */

const BASE_URL = "https://www.coursera.org/api/";
const GRAPHQL_URL = "https://www.coursera.org/graphql-gateway";

// Trạng thái toàn cục
let state = {
    config: {},
    userId: null,
    courseId: null,
    isRunning: false
};
let currentKeyIndex = 0; 
// Cấu hình SidePanel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

/**
 * 1. CẤU HÌNH MẠNG (DNR Rules)
 */
async function setupNetRules() {
    const rules = [{
        "id": 1,
        "priority": 1,
        "action": {
            "type": "modifyHeaders",
            "requestHeaders": [
                { "header": "x-requested-with", "operation": "set", "value": "XMLHttpRequest" },
                { "header": "x-coursera-version", "operation": "set", "value": "3bfd497de04ae0fef167b747fd85a6fbc8fb55df" }
            ]
        },
        "condition": {
            "urlFilter": "*://www.coursera.org/*",
            "resourceTypes": ["xmlhttprequest"]
        }
    }];
    
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: rules
    });
    console.log("✅ DNR Rules updated.");
}
setupNetRules();
// --- HÀM TIỆN ÍCH ---

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logToPanel(text) {
    chrome.runtime.sendMessage({ type: 'statusUpdate', text: text }, () => {
        // Lờ lỗi nếu Sidepanel đóng
        if (chrome.runtime.lastError) {
            console.warn("Sidepanel closed, message ignored.");
        }
    });
}

// --- CẤU HÌNH MAPPING CÂU HỎI ---
const QUESTION_MAP = {
    'Submission_MultipleChoiceQuestion': ['multipleChoiceResponse', 'MULTIPLE_CHOICE'],
    'Submission_CheckboxQuestion': ['checkboxResponse', 'CHECKBOX'],
    'Submission_PlainTextQuestion': ['plainTextResponse', 'PLAIN_TEXT'],
    'Submission_RichTextQuestion': ['richTextResponse', 'RICH_TEXT'],
    'Submission_RichTextQuestionSchema': ['richTextResponse', 'RICH_TEXT'],
    'Submission_MultipleChoiceReflectQuestion': ['multipleChoiceResponse', 'MULTIPLE_CHOICE'],
    'Submission_CheckboxReflectQuestion': ['checkboxResponse', 'CHECKBOX'],
    'Submission_MathQuestion': ['mathResponse', 'MATH'],
    'Submission_NumericQuestion': ['numericResponse', 'NUMERIC'],
    'Submission_RegexQuestion': ['regexResponse', 'REGEX'],
    'Submission_TextExactMatchQuestion': ['textExactMatchResponse', 'TEXT_EXACT_MATCH'],
    'Submission_TextReflectQuestion': ['textReflectResponse', 'TEXT_REFLECT'],
    'Submission_MultipleFillableBlanksQuestion': ['multipleFillableBlanksResponse', 'MULTIPLE_FILLABLE_BLANKS']
};

const F = {
    'CML': 'fragment Cml on CmlContent { cmlValue dtdId }',
    'RT': 'fragment RT on Submission_RichText { ... on CmlContent { ...Cml } }',
    'INSTR': 'fragment Instr on Submission_Instructions { overview { ...RT } reviewCriteria { ... RT } }',
    'OPT': 'fragment Opt on Submission_MultipleChoiceOption { id display { ...RT } }',
    'Q_RT': 'fragment Q_RT on Submission_RichTextQuestion { id partId: id questionSchema { prompt { ...RT } } }',
    'Q_PT': 'fragment Q_PT on Submission_PlainTextQuestion { id partId: id questionSchema { prompt { ...RT } } }',
    'Q_MC': 'fragment Q_MC on Submission_MultipleChoiceQuestion { id partId: id questionSchema { prompt { ...RT } options { ...Opt } } }',
    'Q_CB': 'fragment Q_CB on Submission_CheckboxQuestion { id partId: id questionSchema { prompt { ...RT } options { ...Opt } } }',
    'Q_MCR': 'fragment Q_MCR on Submission_MultipleChoiceReflectQuestion { id partId: id questionSchema { prompt { ...RT } options { ...Opt } } }',
    'Q_CBR': 'fragment Q_CBR on Submission_CheckboxReflectQuestion { id partId: id questionSchema { prompt { ...RT } options { ...Opt } } }',
    'Q_TR': 'fragment Q_TR on Submission_TextReflectQuestion { id partId: id questionSchema { prompt { ...RT } } }',
    'Q_MFB': 'fragment Q_MFB on Submission_MultipleFillableBlanksQuestion { id partId: id questionSchema { prompt { ...RT } fillableBlanks { ... on Submission_MultipleChoiceFillableBlank { id } } } }',
    'Q_TB': 'fragment Q_TB on Submission_TextBlock { id partId: id body { ...RT } }',
    'Q_FU': 'fragment Q_FU on Submission_FileUploadQuestion { id partId: id questionSchema { prompt { ...RT } } }'
};
const ALL_FRAGMENTS = Object.values(F).join(' ');

// --- HÀM TIỆN ÍCH ---

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- FETCH COURSERA REST API ---
async function fetchCoursera(endpoint, options = {}) {
    try {
        const url = BASE_URL + endpoint;
        const headers = {
            'x-csrf3-token': state.config.csrfToken || '',
            'Cookie': `CAUTH=${state.config.cauthToken || ''}; CSRF3-Token=${state.config.csrfToken || ''}`,
            'Referer': 'https://www.coursera.org',
            'Origin': 'https://www.coursera.org',
            'x-coursera-version': '3bfd497de04ae0fef167b747fd85a6fbc8fb55df'
        };

        if (options.body) headers['Content-Type'] = 'application/json';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            logToPanel(`      ⚠️ API Fail (${endpoint}) ${response.status}`);
            return { error: `HTTP ${response.status}` };
        }
        
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (err) {
        if (err.name === 'AbortError') return { error: 'Timeout' };
        return { error: err.message };
    }
}

// --- FETCH COURSERA GRAPHQL ---
async function fetchCourseraGraphQL(opName, query, variables = {}) {
    let url = GRAPHQL_URL;
    try {
        const headers = {
            'x-csrf3-token': state.config.csrfToken || '',
            'Cookie': `CAUTH=${state.config.cauthToken || ''}; CSRF3-Token=${state.config.csrfToken || ''}`,
            'Referer': 'https://www.coursera.org/',
            'Origin': 'https://www.coursera.org',
            'Content-Type': 'application/json',
            'x-coursera-version': '3bfd497de04ae0fef167b747fd85a6fbc8fb55df',
            'x-requested-with': 'XMLHttpRequest'
        };

        const cleanQuery = query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (url.includes('graphql-gateway')) url += `?opname=${opName}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        let response = await fetch(url, {
            method: 'POST', headers: headers,
            body: JSON.stringify({ operationName: opName, query: cleanQuery, variables: variables }),
            signal: controller.signal
        });

        if (response.status === 404 || response.status === 500) {
            url = BASE_URL + 'opencourse.v1/graphql';
            if (opName) url += `?opname=${opName}`;
            response = await fetch(url, {
                method: 'POST', headers: headers,
                body: JSON.stringify({ operationName: opName, query: cleanQuery, variables: variables }),
                signal: controller.signal
            });
        }
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            return { error: `HTTP ${response.status}`, body: errText };
        }

        const json = await response.json();
        if (json.errors) return { error: json.errors[0]?.message, errors: json.errors };
        return json;

    } catch (err) {
        return { error: err.message };
    }
}

// --- LOGIC CHÍNH ---

async function getUserId() {
    try {
        const data = await fetchCoursera('adminUserPermissions.v1?q=my');
        if (data && data.elements && data.elements[0]) {
            state.userId = data.elements[0].id;
            logToPanel(`✅ User ID: ${state.userId}`);
            return true;
        }
        return false;
    } catch (e) { return false; }
}
async function getCourseMaterials() {
    let slug = state.config.slug || '';
    if (slug.includes('/')) slug = slug.split('/').filter(Boolean).pop(); 
    logToPanel(`🔍 Khởi tạo dữ liệu cho: ${slug}`);

    const params = new URLSearchParams({
        'q': 'slug', 'slug': slug,
        'includes': 'modules,lessons,passableLessonElements,items',
        'fields': 'moduleIds,onDemandCourseMaterialModules.v1(name,lessonIds),onDemandCourseMaterialLessons.v1(name,elementIds),onDemandCourseMaterialItems.v2(name,contentSummary,timeCommitment,isLocked)',
        'showLockedItems': 'true'
    });

    const data = await fetchCoursera(`onDemandCourseMaterials.v2/?${params.toString()}`);
    if (data.error || !data.elements || data.elements.length === 0) throw new Error("Course info fetch failed.");

    state.courseId = data.elements[0].id;
    const linked = data.linked || {};
    const itemsMap = {};
    (linked['onDemandCourseMaterialItems.v2'] || []).forEach(item => itemsMap[item.id] = item);
    const lessonsMap = Object.fromEntries((linked['onDemandCourseMaterialLessons.v1'] || []).map(l => [l.id, l]));
    const modules = linked['onDemandCourseMaterialModules.v1'] || [];
    const courseModules = data.elements[0].moduleIds || [];

    // Tính tổng số bài để chia % chính xác
    let totalItems = 0;
    courseModules.forEach(modId => {
        const mod = modules.find(m => m.id === modId);
        if (mod) mod.lessonIds.forEach(lid => { if (lessonsMap[lid]) totalItems += (lessonsMap[lid].elementIds || []).length; });
    });

    let processedCount = 0;
    for (const modId of courseModules) {
        const module = modules.find(m => m.id === modId);
        if (!module) continue;
        logToPanel(`--- [Học phần] ${module.name} ---`);
        for (const lessonId of module.lessonIds || []) {
            const lesson = lessonsMap[lessonId];
            if (!lesson) continue;
            for (const elemId of lesson.elementIds || []) {
                processedCount++;
                const itemId = elemId.split('~').pop();
                const item = itemsMap[itemId] || itemsMap[elemId];
                if (item) {
                    // GỬI PHẦN TRĂM TIẾN ĐỘ VỀ UI (Đúng vị trí)
                    let percent = (processedCount / totalItems) * 100;
                    chrome.runtime.sendMessage({ type: 'updateProgress', percent: percent }, () => {
                        if (chrome.runtime.lastError) {}
                    });
                    
                    logToPanel(`    [${processedCount}/${totalItems}] ${item.name}`);
                    await processItem(item, slug);
                }
            }
        }
    }
}
async function processItem(item, courseSlug) {
    const type = item.contentSummary?.typeName || 'unknown';
    const id = item.id;
    const name = item.name;
    if (item.isLocked) return;

    const isLti = type === 'ungradedLti'; 
    const isWidget = type === 'ungradedWidget';
    const isReading = ['supplement', 'reading', 'ungradedPlugin'].includes(type);
    const isQuiz = ['gradedQuiz', 'quiz', 'exam', 'ungradedAssignment'].includes(type) || name.toLowerCase().includes('quiz');

    try {
        if (type === 'lecture' || type === 'video') {
            if (state.config.skipVideo) { 
                logToPanel("      📺 Watching video..."); 
                await watchVideoFull(item, courseSlug); 
                await sleep(300); 
            }
        } 
        else if (isLti) {
            if (state.config.solveWidget) { 
                logToPanel(`      🧪 Launching Lab (${type})...`); 
                await markLtiCompleted(id);
                await sleep(500); 
            }
        }
        else if (isWidget) {
            if (state.config.solveWidget) { 
                logToPanel(`      🧩 Completing Widget (${type})...`); 
                await markWidgetCompleted(id); 
                await sleep(500); 
            }
        }
        else if (isReading) {
            if (state.config.readSupplement) { 
                logToPanel(`      📖 Reading supplement (${type})...`); 
                await readSupplementFull(id); 
                await sleep(300); 
            }
        } 
        else if (isQuiz) {
            if (state.config.solveQuiz) { 
                logToPanel(`      🧠 Solving quiz... (${type})`); 
                await solveQuiz(id, name, type); 
                await sleep(1500); 
            }
        }
    } catch (e) { logToPanel(`      ❌ Item error: ${e.message}`); }
}
// --- VIDEO & READING ---
async function watchVideoFull(item, slug) {
    const itemId = item.id;
    const meta = await fetchCoursera(`onDemandLectureVideos.v1/${state.courseId}~${itemId}?includes=video&fields=disableSkippingForward,startMs,endMs`);
    const videoId = meta.linked?.['onDemandVideos.v1']?.[0]?.id;
    
    if (videoId) {
        await fetchBase('POST', `opencourse.v1/user/${state.userId}/course/${slug}/item/${itemId}/lecture/videoEvents/play?autoEnroll=false`, { contentRequestBody: {} });
        const duration = item.timeCommitment || 60000;
        await fetchBase('POST', `onDemandVideoProgresses.v1/${state.userId}~${state.courseId}~${videoId}`, {
            videoProgressId: `${state.userId}~${state.courseId}~${videoId}`,
            viewedUpTo: duration + 5000 
        });
        await sleep(200);
        await fetchBase('POST', `opencourse.v1/user/${state.userId}/course/${slug}/item/${itemId}/lecture/videoEvents/ended?autoEnroll=false`, { contentRequestBody: {} });
    }
    await markCompleted(itemId);
}

async function readSupplementFull(itemId) {
    await fetchBase('POST', 'onDemandSupplementCompletions.v1', {
        courseId: state.courseId,
        itemId: itemId,
        userId: parseInt(state.userId)
    });
    await markCompleted(itemId);
}

async function markCompleted(itemId) {
    await fetchBase('POST', 'onDemandCourseItemProgress.v1', {
        courseId: state.courseId, itemId: itemId, progressState: "COMPLETED"
    });
}
// --- QUIZ SOLVER HOÀN CHỈNH (GROQ OPTIMIZED) ---
async function solveQuiz(itemId, itemName, itemType) {
    try {
        const queryState = ALL_FRAGMENTS + `
        query QueryState($courseId: ID!, $itemId: ID!) { 
            SubmissionState { 
                queryState(courseId: $courseId, itemId: $itemId) { 
                    ... on Submission_SubmissionState { 
                        allowedAction 
                        integritySettings { attemptId } 
                        attempts { 
                            inProgressAttempt { 
                                id 
                                draft { 
                                    id instructions { ...Instr } 
                                    parts { __typename ...Q_MC ...Q_CB ...Q_PT ...Q_RT ...Q_MCR ...Q_CBR ...Q_TR ...Q_MFB ...Q_TB ...Q_FU } 
                                } 
                            } 
                        } 
                    } 
                    ... on Submission_QueryStateFailure { errors { errorCode } } 
                } 
            } 
        }`;

        let response = await fetchCourseraGraphQL('QueryState', queryState, { courseId: state.courseId, itemId: itemId });
        if (response.error) return;

        let subState = response?.data?.SubmissionState?.queryState;
        let allowedAction = subState?.allowedAction;

        if (allowedAction === 'START_NEW_ATTEMPT' || allowedAction === 'REWORK_SUBMISSION') {
            logToPanel('      🚀 Đang bắt đầu lượt mới...');
            const startMutation = `mutation Submission_StartAttempt($courseId: ID!, $itemId: ID!) { Submission_StartAttempt(input: {courseId: $courseId, itemId: $itemId}) { ... on Submission_StartAttemptSuccess { __typename } ... on Submission_StartAttemptFailure { errors { errorCode } } } }`;
            await fetchCourseraGraphQL('Submission_StartAttempt', startMutation, { courseId: state.courseId, itemId: itemId });
            await sleep(2000); 
            response = await fetchCourseraGraphQL('QueryState', queryState, { courseId: state.courseId, itemId: itemId });
            subState = response?.data?.SubmissionState?.queryState;
        }

        const attempt = subState?.attempts?.inProgressAttempt;
        if (!attempt) return logToPanel('      ℹ️ Không tìm thấy bài nháp.');

        const draft = attempt.draft;
        const parts = (draft.parts || []).filter(p => p.partId); // Chỉ lấy các phần có ID (câu hỏi thật)
        const questionMap = new Map();

        let prompt = `You are a professional student. Answer the following questions.
RULES:
1. Respond ONLY with a JSON array: [{"partId": "...", "choiceId": "...", "text": "..."}].
2. For Multiple Choice/Checkbox: Use the EXACT 'Option ID' provided.
3. For Text/Numeric: Provide the answer in the 'text' field.
4. If you don't know, make an educated guess.

[QUESTIONS]`;

        parts.forEach((p, index) => {
            questionMap.set(p.partId, p);
            const qText = p.questionSchema?.prompt?.cmlValue || p.body?.cmlValue || 'Question';
            prompt += `\n${index + 1}. [Question ID: ${p.partId}] ${qText}\n`;
            if (p.questionSchema?.options) {
                p.questionSchema.options.forEach(opt => {
                    prompt += `   - Option ID [${opt.id}]: ${opt.display?.cmlValue}\n`;
                });
            }
        });

        logToPanel(`      🤖 Đang hỏi Groq AI (${questionMap.size} câu hỏi)...`);
        const aiRaw = await callGroq(prompt);
        
        // Làm sạch JSON
        let cleanJson = aiRaw.trim().replace(/^```json/i, "").replace(/```$/g, "").trim();
        const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch) throw new Error("AI trả về format không phải JSON.");
        
        const answers = JSON.parse(jsonMatch[0]);
        const responseMap = [];

        answers.forEach(ans => {
            const q = questionMap.get(ans.partId);
            if (!q) return;

            const [resKey, typeName] = QUESTION_MAP[q.__typename] || ['plainTextResponse', 'PLAIN_TEXT'];
            let responseData;

            // Xử lý logic chọn đáp án cho từng loại câu hỏi
            if (typeName === 'MULTIPLE_CHOICE' || typeName === 'CHECKBOX') {
                const chosenIds = Array.isArray(ans.choiceId) ? ans.choiceId : [ans.choiceId || ans.answer];
                // Lọc bỏ những ID không tồn tại trong câu hỏi gốc để tránh lỗi Save
                const validOptions = q.questionSchema.options.map(o => o.id);
                const filteredIds = chosenIds.filter(id => validOptions.includes(String(id)));
                
                if (typeName === 'MULTIPLE_CHOICE') {
                    responseData = { chosen: String(filteredIds[0] || validOptions[0]) };
                } else {
                    responseData = { chosen: filteredIds.length > 0 ? filteredIds.map(String) : [validOptions[0]] };
                }
            } else {
                // Đối với MATH, NUMERIC, PLAIN_TEXT dùng key 'answer'
                responseData = { answer: String(ans.text || ans.answer || "") };
            }

            responseMap.push({
                questionId: q.partId,
                questionType: typeName,
                questionResponse: { [resKey]: responseData }
            });
        });

        // --- LƯU ĐÁP ÁN ---
        // Thử lần lượt Attempt ID và Draft ID vì Coursera đôi khi chỉ nhận 1 trong 2
        const idsToTry = [attempt.id, subState.integritySettings?.attemptId, draft.id].filter(Boolean);
        let saveSuccess = false;

        for (const idToTry of idsToTry) {
            const saveMutation = `mutation Submission_SaveResponses($input: Submission_SaveResponsesInput!) { Submission_SaveResponses(input: $input) { ... on Submission_SaveResponsesSuccess { __typename } ... on Submission_SaveResponsesFailure { errors { errorCode message } } } }`;
            const saveRes = await fetchCourseraGraphQL('Submission_SaveResponses', saveMutation, {
                input: { courseId: state.courseId, itemId: itemId, attemptId: idToTry, questionResponses: responseMap }
            });

            const result = saveRes.data?.Submission_SaveResponses;
            if (result?.__typename === 'Submission_SaveResponsesSuccess') {
                saveSuccess = true;
                break;
            } else if (result?.errors) {
                console.error(`Lỗi Save với ID ${idToTry}:`, result.errors[0]);
            }
        }

        if (!saveSuccess) {
            logToPanel('      ❌ Lưu đáp án thất bại. Hãy kiểm tra Console để xem lỗi chi tiết.');
            return;
        }

        // --- NỘP BÀI ---
        await sleep(2000); 
        logToPanel('      📤 Đang nộp bài...');
        const submitMutation = `mutation Submission_SubmitLatestDraft($input: Submission_SubmitLatestDraftInput!) { Submission_SubmitLatestDraft(input: $input) { ... on Submission_SubmitLatestDraftSuccess { __typename } ... on Submission_SubmitLatestDraftFailure { errors { errorCode message } } } }`;
        
        let submitSuccess = false;
        for (const idToTry of idsToTry) {
            const submitRes = await fetchCourseraGraphQL('Submission_SubmitLatestDraft', submitMutation, {
                input: { courseId: state.courseId, itemId: itemId, submissionId: idToTry }
            });

            if (submitRes.data?.Submission_SubmitLatestDraft?.__typename === 'Submission_SubmitLatestDraftSuccess') {
                logToPanel(`      ✅ ĐÃ XONG: "${itemName}"`);
                submitSuccess = true;
                break;
            }
        }

        if (!submitSuccess) logToPanel('      ⚠️ Lưu thành công nhưng nộp thất bại. Hãy bấm nộp tay trên web.');

    } catch (err) {
        logToPanel(`      ❌ Lỗi Quiz: ${err.message}`);
    }
}
async function callGroq(prompt) {
    const rawKeys = state.config.geminiKey || ""; 
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k !== "");
    if (keys.length === 0) throw new Error("THIẾU GROQ API KEY!");

    for (let i = 0; i < keys.length; i++) {
        const idx = currentKeyIndex % keys.length;
        const activeKey = keys[idx];
        const url = `https://api.groq.com/openai/v1/chat/completions`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeKey}`
                },
                body: JSON.stringify({ 
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are a JSON assistant. Never talk, only return JSON arrays." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0, // Đặt bằng 0 để kết quả ổn định, ít babble
                    top_p: 1
                })
            });

            const data = await response.json();

            if (response.status === 429) {
                logToPanel(`      🔄 Key ${idx + 1} Limit. Đang đổi Key...`);
                currentKeyIndex++;
                continue;
            }

            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
        } catch (e) {
            if (i === keys.length - 1) throw e;
        }
    }
}

// --- FETCH HELPER ---
async function fetchBase(method, endpoint, body) {
    const url = BASE_URL + endpoint;
    const headers = {
        'X-Csrf3-Token': state.config.csrfToken || '',
        'Cookie': `CAUTH=${state.config.cauthToken || ''}; CSRF3-Token=${state.config.csrfToken || ''}`,
        'Referer': 'https://www.coursera.org/',
        'Origin': 'https://www.coursera.org',
        'Content-Type': 'application/json'
    };
    return fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

async function startAutomation() {
    if (state.isRunning) return;
    state.isRunning = true;
    logToPanel("🚀 Bắt đầu quá trình tự động hóa...");
    try {
        const stored = await chrome.storage.local.get(['geminiKey', 'cauthToken', 'csrfToken']);
        state.config = { ...state.config, ...stored };

        if (await getUserId()) {
            await getCourseMaterials();
            logToPanel("✅ HOÀN THÀNH!");
        } else {
            throw new Error("Thất bại xác thực. Hãy làm mới Cookie!");
        }
    } catch (e) {
        logToPanel(`❌ Lỗi hệ thống: ${e.message}`);
    } finally {
        state.isRunning = false;
        // Báo hiệu kết thúc cho giao diện xử lý
        chrome.runtime.sendMessage({ type: 'automationFinished' }, () => {
            if (chrome.runtime.lastError) {}
        });
    }
}
async function markWidgetCompleted(itemId) {
    try {
        const sessionId = generateSessionId();
        const widgetId = `${state.userId}~${state.courseId}~${itemId}`;
        
        // Chỉ gửi PUT Widget Progress
        const response = await fetchBase('PUT', `onDemandWidgetProgress.v1/${widgetId}`, {
            sessionId: sessionId,
            progressState: "Completed"
        });
        
        // Luôn gửi markCompleted chung để đồng bộ tiến độ hiển thị trên web
        await markCompleted(itemId);

        if (response.ok) {
            logToPanel(`      ✅ Widget completed`);
        } else {
            // Không báo lỗi to nếu web vẫn ghi nhận thành công
            console.warn(`Widget PUT status: ${response.status}`);
        }
    } catch (e) {
        await markCompleted(itemId); // Fallback
    }
}

/**
 * XỬ LÝ BÀI LAB (LTI) - Dựa trên Log XHR POST 201
 */
async function markLtiCompleted(itemId) {
    const endpoint = `onDemandLtiUngradedLaunches.v1/?fields=endpointUrl%2CauthRequestUrl%2CsignedProperties`;
    
    // Gửi lệnh Launch kèm flag hoàn thành
    const response = await fetchCoursera(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            courseId: state.courseId,
            itemId: itemId,
            learnerId: parseInt(state.userId),
            markItemCompleted: true // ✅ Đây là chìa khóa để hoàn thành bài Lab
        })
    });

    if (!response.error) {
        logToPanel(`      ✅ Lab/LTI Completed.`);
    } else {
        logToPanel(`      ⚠️ LTI Launch failed, trying fallback...`);
    }

    // Luôn gửi thêm markCompleted tổng quát để web cập nhật tích xanh
    await markCompleted(itemId);
}
// Hàm tạo sessionId ngẫu nhiên
function generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'startAutomation') {
        state.config = { ...state.config, ...request.config };
        startAutomation();
    }
});