# Bộ câu hỏi hội đồng có thể hỏi về dự án WiseBot RAG

Tài liệu này dùng để ôn bảo vệ đồ án. Nội dung bám theo cấu trúc hiện tại của dự án `wisebot-rag`: frontend React/Vite, các service Spring Boot, các service FastAPI cho AI/embedding, PostgreSQL, Qdrant, Ollama, Apache và Cloudflare Tunnel.

## 1. Tóm tắt dự án

WiseBot RAG là hệ thống trợ lý AI cho doanh nghiệp/trường học, cho phép người dùng tạo kho tri thức, tải tài liệu, xử lý tài liệu thành các đoạn nhỏ, sinh vector embedding, lưu vào Qdrant và trả lời câu hỏi dựa trên dữ liệu đã nạp. Hệ thống có phân quyền người dùng, quản lý knowledge base, playground chat, widget nhúng website, API key public, billing và cấu hình chuyển đổi giữa AI local/API.

Kiến trúc chính:

- Frontend: React, TypeScript, Vite, Tailwind, chạy qua Apache khi deploy.
- API Gateway: Spring Boot, xác thực JWT người dùng, định tuyến request đến các service.
- User Service: đăng ký, đăng nhập, xác minh email, reset password, role, tenant, system settings.
- Document Service: quản lý knowledge base, upload tài liệu, lưu file, xử lý bất đồng bộ.
- Kreuzberg Service: FastAPI parse tài liệu, giữ cấu trúc markdown/bảng và chunking.
- Embedding Service: sinh embedding, tạo collection, lưu vector vào Qdrant, semantic search.
- AI Service: điều phối RAG nâng cao, query rewrite, hybrid search, rerank, gọi LLM, streaming answer.
- Chat Service: quản lý session, message, feedback, citation, gọi AI service.
- Widget Service: cấu hình widget, domain allowlist, session public, API key.
- Billing Service: gói dịch vụ, subscription, invoice, VNPay/VietQR.
- Database: PostgreSQL cho dữ liệu nghiệp vụ, Qdrant cho vector.
- Model runtime: Ollama local hoặc provider OpenAI-compatible.

Luồng RAG cơ bản:

1. Người dùng upload tài liệu vào knowledge base.
2. Document Service lưu file và tạo bản ghi document.
3. AsyncDocumentProcessor gọi Kreuzberg Service để parse/chunk tài liệu.
4. Document chunks được gửi sang Embedding Service.
5. Embedding Service sinh vector và upsert vào Qdrant, kèm metadata `tenant_id`, `document_id`, `chunk_index`, `chunk_text`.
6. Khi hỏi, Chat Service gọi AI Service.
7. AI Service rewrite/multi-query nếu cần, gọi Embedding Service search, lọc/rerank context, build prompt.
8. LLM sinh câu trả lời dựa trên context, trả kèm citation/metadata.

## 2. Câu hỏi và câu trả lời mẫu

### 1. Mục tiêu chính của dự án là gì?

Mục tiêu là xây dựng một trợ lý AI có khả năng trả lời dựa trên tài liệu riêng của từng tenant. Thay vì để mô hình trả lời theo kiến thức chung, hệ thống dùng RAG để truy xuất thông tin liên quan từ knowledge base rồi đưa vào prompt cho LLM. Nhờ đó câu trả lời có tính bám tài liệu, có thể áp dụng cho dữ liệu nội bộ và dễ cập nhật khi tài liệu thay đổi.

### 2. Vì sao chọn phương pháp RAG thay vì fine-tuning?

RAG phù hợp hơn vì dữ liệu tài liệu thay đổi thường xuyên, cần cập nhật nhanh và không muốn huấn luyện lại mô hình mỗi lần đổi tài liệu. Fine-tuning phù hợp để dạy mô hình phong cách hoặc năng lực tổng quát, nhưng không tối ưu cho dữ liệu tri thức động. RAG cũng giúp giảm chi phí, dễ truy xuất nguồn và có thể xóa/cập nhật từng tài liệu trong vector database.

### 3. RAG trong hệ thống hoạt động như thế nào?

RAG gồm hai giai đoạn. Giai đoạn offline là upload, parse, chunk, embedding và lưu vector. Giai đoạn online là nhận câu hỏi, sinh embedding cho câu hỏi, tìm các chunk liên quan trong Qdrant, build prompt với context, sau đó LLM sinh câu trả lời. Trong dự án, phần parse nằm ở Kreuzberg Service, embedding/search ở Embedding Service, còn phần build prompt và gọi LLM nằm ở AI Service.

### 4. Tại sao cần chia tài liệu thành chunk?

LLM không thể nhận toàn bộ tài liệu dài trong một prompt, và vector search cũng cần đơn vị nhỏ để truy xuất chính xác. Chunk giúp hệ thống tìm đúng đoạn liên quan thay vì lấy cả file. Dự án dùng chunk size và overlap để cân bằng giữa độ đầy đủ ngữ cảnh và độ chính xác tìm kiếm.

### 5. Chunk overlap có tác dụng gì?

Chunk overlap giữ lại một phần nội dung giữa hai chunk liền kề để tránh mất ngữ cảnh ở ranh giới cắt đoạn. Nếu không có overlap, một câu hoặc một ý quan trọng nằm giữa hai chunk có thể bị tách rời, làm giảm chất lượng truy xuất. Tuy nhiên overlap quá lớn sẽ tăng số chunk, tăng chi phí embedding và dung lượng vector.

### 6. Vì sao dùng Qdrant làm vector database?

Qdrant hỗ trợ lưu vector kèm payload metadata, search theo cosine similarity và filter theo tenant/document. Điều này phù hợp với hệ thống multi-tenant vì mỗi truy vấn có thể giới hạn kết quả theo `tenant_id`. Qdrant cũng dễ chạy bằng Docker, có API rõ ràng và hiệu năng tốt cho semantic search.

### 7. Embedding là gì và đóng vai trò gì trong dự án?

Embedding là vector số biểu diễn ý nghĩa của văn bản. Trong dự án, mỗi chunk tài liệu và câu hỏi người dùng đều được chuyển thành vector. Qdrant so sánh vector câu hỏi với vector chunk để tìm các đoạn có ý nghĩa gần nhất. Chất lượng embedding ảnh hưởng trực tiếp đến chất lượng truy xuất.

### 8. Vì sao khi đổi embedding model cần reprocess knowledge base?

Mỗi embedding model tạo vector trong một không gian khác nhau. Nếu câu hỏi được embedding bằng model mới nhưng vector tài liệu trong Qdrant được tạo bằng model cũ, độ tương đồng sẽ không còn đáng tin. Vì vậy khi đổi provider hoặc model embedding, cần rebuild/reprocess tài liệu để đồng bộ vector.

### 9. Hệ thống hỗ trợ AI local và AI API như thế nào?

AI Service có RuntimeLlmManager để chuyển giữa provider local Ollama và provider OpenAI-compatible. Embedding Service cũng có RuntimeEmbeddingManager cho embedding local hoặc API. Cấu hình mode được lưu qua system setting ở User Service, giúp admin đổi mode từ giao diện mà không phải sửa code.

### 10. Ưu điểm của dùng Ollama local là gì?

Ưu điểm là dữ liệu không phải gửi ra ngoài, phù hợp với dữ liệu nội bộ hoặc yêu cầu bảo mật. Chi phí vận hành có thể thấp hơn nếu đã có máy chủ/GPU. Hệ thống cũng độc lập hơn với dịch vụ bên thứ ba. Nhược điểm là cần tài nguyên phần cứng, tốc độ và chất lượng phụ thuộc model local.

### 11. Ưu điểm của dùng OpenAI-compatible API là gì?

Provider API thường có model mạnh hơn, ổn định hơn và dễ mở rộng mà không cần tự vận hành GPU. Nhược điểm là phát sinh chi phí theo usage, phụ thuộc mạng và cần cân nhắc bảo mật dữ liệu khi gửi prompt/context ra ngoài.

### 12. API Gateway có vai trò gì?

API Gateway là điểm vào chung cho frontend. Nó xác thực JWT người dùng, định tuyến request đến user/document/chat/widget/billing service và giúp frontend không cần biết địa chỉ từng service nội bộ. Khi deploy Apache, đường `/api/` được proxy đến gateway ở port `9000`.

### 13. Vì sao hệ thống dùng microservices?

Microservices giúp tách trách nhiệm rõ ràng: auth, document, chat, embedding, AI, widget, billing. Mỗi service có thể phát triển, scale và debug riêng. Ví dụ AI/embedding dùng FastAPI vì phù hợp Python ecosystem, còn nghiệp vụ user/billing/document dùng Spring Boot. Đổi lại, microservices làm hệ thống phức tạp hơn về networking, cấu hình env, auth nội bộ và observability.

### 14. Hạn chế của kiến trúc microservices trong dự án là gì?

Hạn chế là cần nhiều container, nhiều database/schema, nhiều biến môi trường và cần đồng bộ secret giữa các service. Khi lỗi xảy ra có thể khó truy vết vì request đi qua nhiều service. Ngoài ra việc deploy local cần Docker, RAM đủ lớn và startup order đúng.

### 15. Hệ thống bảo mật giữa các service như thế nào?

Hệ thống dùng hai nhóm xác thực. Người dùng dùng JWT access/refresh token do User Service phát hành. Giao tiếp nội bộ giữa AI, embedding, chat, document dùng service JWT hoặc internal API key. Các service Python kiểm tra issuer, secret, audience nếu có và allowed subjects để tránh service lạ gọi API nội bộ.

### 16. Vì sao cần tách JWT người dùng và JWT nội bộ?

JWT người dùng dùng để xác thực hành động từ client và mang thông tin user/tenant/role. JWT nội bộ dùng cho giao tiếp service-to-service và không phụ thuộc phiên đăng nhập của người dùng. Tách hai loại token giúp giảm rủi ro: nếu một token user bị lộ thì không thể trực tiếp gọi các endpoint nội bộ của AI/embedding.

### 17. Tenant isolation được thực hiện như thế nào?

Các dữ liệu quan trọng đều gắn `tenant_id`. Khi search trong Qdrant, Embedding Service thêm filter `tenant_id` để chỉ trả về vector thuộc tenant hiện tại. Các API frontend cũng lấy tenant từ token. Điều này giúp nhiều tổ chức dùng chung hệ thống mà dữ liệu không bị trộn.

### 18. Cơ chế phân quyền người dùng hoạt động ra sao?

User Service quản lý user, role và tenant. Token chứa authority/role để gateway và service kiểm tra quyền. Giao diện cũng lọc menu theo role như ADMIN, OWNER, USER. ADMIN có các chức năng quản trị như user management, billing admin, analytics; user thường tập trung vào knowledge base, playground, widget.

### 19. Quy trình upload và xử lý tài liệu có điểm gì đáng chú ý?

Document Service lưu metadata và file, sau đó xử lý bất đồng bộ bằng `AsyncDocumentProcessor`. Service này gọi Kreuzberg để parse tài liệu, tạo chunk, lưu DocumentChunk với trạng thái PENDING, rồi gọi Embedding Service để embedding. Khi embedding thành công, chunk chuyển sang EMBEDDED và document chuyển sang PROCESSED; nếu lỗi thì chuyển FAILED.

### 20. Vì sao xử lý tài liệu nên chạy bất đồng bộ?

Parse tài liệu, chunking và embedding có thể mất nhiều thời gian, đặc biệt với file lớn hoặc model local. Nếu xử lý đồng bộ, request upload dễ timeout và trải nghiệm người dùng kém. Xử lý bất đồng bộ giúp upload trả về nhanh, frontend có thể polling trạng thái document.

### 21. Hệ thống xử lý file bảng như XLSX như thế nào?

Kreuzberg Service có logic chuyển XLSX sang markdown/table-like content. Việc giữ cấu trúc bảng giúp RAG trả lời tốt hơn với dữ liệu dạng danh sách, học phí, sản phẩm, giá, hoặc FAQ có bảng. AI Service cũng có một số hàm xử lý markdown table để trả lời hoặc gợi ý sản phẩm dựa trên dữ liệu bảng.

### 22. Query rewriting dùng để làm gì?

Query rewriting tạo biến thể câu hỏi để tăng khả năng tìm thấy chunk liên quan, nhất là khi người dùng hỏi khác cách diễn đạt trong tài liệu. AI Service luôn giữ câu hỏi gốc và chỉ thêm biến thể nếu còn bám sát ý chính. Điều này giảm nguy cơ rewrite làm lệch ý hỏi.

### 23. Hybrid search và rerank có ý nghĩa gì?

Semantic search mạnh về ý nghĩa nhưng đôi khi bỏ lỡ từ khóa chính xác như mã sản phẩm, tên riêng, mã ngành. Hybrid search kết hợp tín hiệu semantic và keyword để cải thiện truy xuất. Rerank sắp xếp lại các chunk theo mức liên quan với câu hỏi, giúp context đưa vào LLM sạch hơn.

### 24. Hệ thống giảm hallucination bằng cách nào?

Hệ thống giảm hallucination bằng cách bắt LLM trả lời dựa trên context đã truy xuất, kiểm tra context có liên quan, ưu tiên direct answer chunk, giữ citation và có LLM judge nền để đánh giá faithfulness/relevance. Tuy vậy hallucination không thể loại bỏ hoàn toàn, đặc biệt nếu tài liệu thiếu, mâu thuẫn hoặc prompt bị hỏi ngoài phạm vi.

### 25. Citation trong hệ thống có tác dụng gì?

Citation cho biết câu trả lời dựa trên chunk hoặc document nào. Điều này giúp người dùng kiểm chứng lại nguồn, tăng độ tin cậy và hỗ trợ debug khi câu trả lời sai. Trong Chat Service có endpoint lấy citations theo message.

### 26. Widget nhúng website hoạt động như thế nào?

Widget Service quản lý cấu hình widget, domain allowlist, session và API key. Website bên ngoài nhúng script/widget bằng mã cấu hình. Public Widget API kiểm tra code/domain/session trước khi cho chat. Chat public sau đó đi qua Chat Service và AI Service giống luồng RAG bình thường nhưng dành cho visitor.

### 27. Vì sao widget cần domain allowlist?

Domain allowlist giới hạn website nào được phép dùng widget. Nếu không có allowlist, người khác có thể copy script hoặc widget code sang domain khác, gây lạm dụng quota, spam request hoặc rò rỉ trải nghiệm thương hiệu. Allowlist là lớp bảo vệ cơ bản cho public embed.

### 28. Billing Service dùng để làm gì trong dự án?

Billing Service quản lý plan, price, subscription, invoice, payment và giới hạn entitlement. Các service như Document/Chat/Widget có thể gọi Billing Service để kiểm tra quyền sử dụng, ví dụ giới hạn số knowledge base, tính năng widget hoặc usage. Dự án có tích hợp VNPay và VietQR để phù hợp bối cảnh Việt Nam.

### 29. Ưu điểm chính của dự án là gì?

Ưu điểm gồm: kiến trúc tách service rõ ràng, hỗ trợ local AI để bảo mật dữ liệu, có thể đổi provider AI/embedding, có multi-tenant, có widget public, có billing, có streaming answer, có quản lý document và reprocess embedding. Hệ thống không chỉ là demo chat mà có nhiều thành phần gần với sản phẩm SaaS thực tế.

### 30. Hạn chế hiện tại của dự án là gì?

Một số hạn chế có thể nêu thẳng: vận hành nhiều service phức tạp; phụ thuộc chất lượng model local hoặc API; chưa có observability đầy đủ như distributed tracing; rate limiting/audit một số phần còn in-memory; cần thêm test end-to-end; chất lượng RAG phụ thuộc dữ liệu đầu vào, chunking và embedding; khi đổi embedding model phải rebuild vector; nếu tài liệu scan ảnh/OCR kém thì câu trả lời cũng kém.

### 31. Nếu hội đồng hỏi “độ chính xác của hệ thống được đánh giá thế nào”, nên trả lời gì?

Có thể đánh giá bằng bộ câu hỏi chuẩn cho từng knowledge base, so sánh câu trả lời với đáp án mong đợi và kiểm tra citation. Ngoài ra có thể dùng các chỉ số như context relevance, answer relevance, faithfulness, latency và tỷ lệ câu hỏi không tìm được ngữ cảnh. Trong code AI Service đã có LLM Judge nền để ghi điểm faithfulness/relevance, nhưng để nghiên cứu nghiêm túc cần thêm tập test thủ công.

### 32. Nếu tài liệu có thông tin sai hoặc cũ thì hệ thống xử lý ra sao?

RAG không tự biết tài liệu đúng hay sai; nó trả lời dựa trên dữ liệu được cung cấp. Vì vậy cần quy trình quản trị knowledge base: xóa tài liệu cũ, upload bản mới, reprocess document và kiểm tra citation. Ưu điểm của RAG là cập nhật tài liệu nhanh hơn fine-tuning.

### 33. Nếu người dùng hỏi ngoài phạm vi tài liệu thì sao?

Hệ thống có logic kiểm tra context và prompt yêu cầu trả lời dựa trên tài liệu. Khi không có context phù hợp, trợ lý nên từ chối hoặc trả lời rằng chưa có thông tin trong kho tri thức. Đây là cách kiểm soát hallucination và giữ câu trả lời trung thực.

### 34. Vì sao có PostgreSQL và Qdrant cùng lúc?

PostgreSQL lưu dữ liệu quan hệ như user, role, tenant, document metadata, session, message, billing, provider settings. Qdrant lưu vector embedding và payload phục vụ semantic search. Hai loại database giải quyết hai bài toán khác nhau: nghiệp vụ quan hệ và tìm kiếm vector.

### 35. Cách deploy hiện tại hoạt động như thế nào?

Frontend được build bằng Vite thành `frontend/dist`, sau đó copy sang `C:\xampp\htdocs\wisebot`. Apache serve file tĩnh và rewrite SPA về `index.html`. Apache proxy `/api/` sang API Gateway `localhost:9000` và proxy `/ws/` cho websocket. Public HTTPS do Cloudflare Tunnel trỏ tới Apache local.

### 36. Nếu hệ thống chậm, cần tối ưu ở đâu?

Có thể tối ưu theo từng lớp: giảm chunk dư thừa, điều chỉnh top_k, cache kết quả embedding/query phổ biến, dùng model nhỏ hơn hoặc GPU cho Ollama, bật streaming để cải thiện cảm nhận, tách scale AI/embedding service, tối ưu Qdrant index và thêm monitoring latency từng service. Với frontend có thể code-split vì bundle hiện khá lớn.

### 37. Vì sao cần streaming response?

LLM có thể mất nhiều giây để sinh câu trả lời. Streaming giúp người dùng thấy token/kết quả dần thay vì chờ toàn bộ response. Chat Service và AI Service có endpoint stream dùng SSE, cải thiện trải nghiệm trong playground và widget.

### 38. Hệ thống có thể mở rộng theo hướng nào?

Có thể bổ sung distributed tracing, queue chuyên dụng như RabbitMQ/Kafka cho xử lý tài liệu, Redis cho blacklist/rate limit/cache, dashboard đánh giá RAG, phân quyền chi tiết theo workspace, OCR tốt hơn cho PDF scan, hybrid search hoàn chỉnh hơn, reranker chuyên dụng, và CI/CD deploy tự động.

### 39. Điểm khác biệt giữa playground và widget là gì?

Playground dành cho người dùng nội bộ đã đăng nhập để kiểm thử knowledge base, session và provider. Widget dành cho visitor bên ngoài website, dùng cấu hình public, domain allowlist và session public. Cả hai cuối cùng đều dùng pipeline RAG nhưng khác lớp xác thực và bối cảnh sử dụng.

### 40. Nếu hội đồng hỏi “đóng góp kỹ thuật nổi bật của em là gì”, nên trả lời thế nào?

Có thể nhấn mạnh việc tích hợp đầy đủ pipeline RAG end-to-end: upload tài liệu, parse/chunk, embedding, vector search, query rewrite, rerank, streaming answer và citation. Ngoài ra, dự án có thiết kế microservices, multi-tenant, provider switching, widget public và billing, tức là không chỉ thử nghiệm mô hình mà còn xây dựng hệ thống có khả năng triển khai như sản phẩm thực tế.

## 3. Các điểm cần nhớ nhanh

- RAG = Retrieval-Augmented Generation: truy xuất context trước, sinh câu trả lời sau.
- Vector database dùng Qdrant, relational database dùng PostgreSQL.
- Embedding model đổi thì phải rebuild vector.
- Tenant isolation dựa trên `tenant_id` trong DB và filter Qdrant.
- User JWT và service JWT là hai lớp xác thực khác nhau.
- Async processing giúp upload tài liệu không bị timeout.
- Widget public cần domain allowlist để chống lạm dụng.
- Điểm mạnh: end-to-end, multi-service, local/API provider, citation, widget, billing.
- Điểm yếu: vận hành phức tạp, phụ thuộc chất lượng dữ liệu/model, cần thêm monitoring/test/cache.

