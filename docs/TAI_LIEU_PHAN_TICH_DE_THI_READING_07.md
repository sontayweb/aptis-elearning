# BÁO CÁO PHÂN TÍCH & ĐẶC TẢ DỮ LIỆU ĐỀ THI READING 07 (APTIS ESOL)

> **Nguồn trích xuất:** Supabase REST API (`exam_questions`, `exam_sets`)  
> **Thời gian thực hiện:** 2026-10-28  
> **Kỹ năng:** Reading (Đọc hiểu) — Định dạng chuẩn Aptis ESOL British Council  

---

## 📌 I. TỔNG QUAN BỘ ĐỀ THI READING 07

Bộ đề thi Reading 07 gồm trọn vẹn **4 Phần (4 Parts)** tương ứng với 4 `exam_set_id`:

| Part | Exam Set ID | Tên đề / Tiêu đề | Dạng câu hỏi (`question_type`) | Số lượng câu / đơn vị |
| :--- | :--- | :--- | :--- | :--- |
| **Part 1** | `c4c1a08f-d89b-4db2-b098-504701dd8ea8` | Đề 07 - Reading Part 1 | `gap_fill` | 5 chỗ trống |
| **Part 2** | `ced685eb-f48c-43ab-851f-ce2c0a419d6e` | Đề 07 - Making films + Family sports day | `text_cohesion` | 2 đoạn văn (10 câu xáo trộn) |
| **Part 3** | `8b613577-6568-4eee-8814-21a30a4d7e9d` | Đề 07 - Games from childhood (2026) | `opinion_matching` | 4 quan điểm nhân vật & 7 câu hỏi |
| **Part 4** | `cf4c3915-647d-46da-833d-a2681542326e` | Đề 07 - Mountain (Version 5) | `long_reading` | 7 đoạn văn & 7 tiêu đề nối |

---

## 📖 II. NỘI DUNG CHI TIẾT & ĐÁP ÁN TỪNG PHẦN

### 1. PART 1: SENTENCE COMPREHENSION (Điền từ vào chỗ trống)

* **Exam Set ID:** `c4c1a08f-d89b-4db2-b098-504701dd8ea8`
* **Question ID:** `51efafdd-befa-42ca-afe8-a5aa224eb4f2`
* **Đoạn văn hoàn chỉnh:**
  > *"Take the bus to the main **{1: station}**. The bus **{2: stops}** are near my house. My house is **{3: green}** and you can easily recognize it by the color. I cook eggs for a quick **{4: dinner}**. After dinner, we will watch **{5: movies}** on TV."*

#### Bảng đáp án & Lựa chọn:
| Chỗ trống | Danh sách lựa chọn | Đáp án đúng | Index | Lời giải thích |
| :---: | :--- | :--- | :---: | :--- |
| **{1}** | `["station", "run", "walk"]` | **station** | `0` | "main station" (nhà ga chính / trạm xe buýt chính); "run" và "walk" là động từ, không phù hợp sau tính từ "main". |
| **{2}** | `["color", "stops", "driver"]` | **stops** | `1` | "bus stops" (các trạm dừng xe buýt); động từ to-be số nhiều "are" phù hợp với danh từ số nhiều "stops". |
| **{3}** | `["tall", "fat", "green"]` | **green** | `2` | Vế sau nêu: *"you can easily recognize it by the color"* (nhận ra bằng màu sắc) nên tính từ miêu tả phải là màu sắc: "green". |
| **{4}** | `["dinner", "homework", "sore"]` | **dinner** | `0` | "cook eggs for a quick dinner" (nấu trứng cho bữa tối nhanh); câu tiếp theo đề cập *"After dinner"* xác nhận đây là bữa tối. |
| **{5}** | `["sing", "movies", "news"]` | **movies** | `1` | "watch movies on TV" (xem phim trên TV); "sing" là động từ không hợp ngữ pháp tân ngữ. |

---

### 2. PART 2: TEXT COHESION (Sắp xếp câu tạo thành đoạn văn)

* **Exam Set ID:** `ced685eb-f48c-43ab-851f-ce2c0a419d6e`
* **Question ID:** `a6fd3340-eb85-43d8-b979-ae603cd1b821`

Part 2 gồm 2 đoạn văn riêng biệt:

#### Đoạn văn 1: Making films
* **Câu mở đầu cho sẵn (vị trí 0):**  
  `[0]` *"In 1895, the Grand Café in France showed the first ever commercial film."*
* **Thứ tự các câu cần sắp xếp (vị trí 1 đến 5):**
  1. `[1]` *"Films from that period were very different from films of today."*  
     *(Giải thích: Cụm từ "that period" chỉ về năm 1895 ở câu mở đầu).*
  2. `[2]` *"This is because they were all in black and white, and they had no sound."*  
     *(Giải thích: "This is because" giải thích tại sao phim thời kỳ đó lại rất khác biệt - phim đen trắng không có tiếng).*
  3. `[3]` *"In addition to these technical limitations, the film producers also had a limited budget."*  
     *(Giải thích: "these technical limitations" thâu tóm hai hạn chế vừa nêu: đen trắng và câm).*
  4. `[4]` *"This lack of money mainly affected the actors, and they did not earn a lot of money."*  
     *(Giải thích: "This lack of money" liên kết trực tiếp với "limited budget").*
  5. `[5]` *"Things have changed over time, and some of them now earn millions of dollars for appearing in films."*  
     *(Giải thích: "some of them" trỏ về "the actors", tương phản mức thu nhập ít ỏi thời xưa với mức triệu đô hiện nay).*

#### Đoạn văn 2: Family sports day
* **Câu mở đầu cho sẵn (vị trí 0):**  
  `[0]` *"Last weekend the weather was good, so the town held a family sports day in the park."*
* **Thứ tự các câu cần sắp xếp (vị trí 6 đến 10):**
  1. `[6]` *"It started early on Saturday morning with a ten-mile race for adults."*  
     *(Giải thích: "It" thay thế cho "family sports day", bắt đầu trình tự thời gian sự kiện sáng thứ 7).*
  2. `[7]` *"Sixty men and women ran in this, and Ms Kamur won with a very fast time."*  
     *(Giải thích: "ran in this" liên kết với "ten-mile race for adults" ở câu trước).*
  3. `[8]` *"After she had received her prize, the children's activities and competitions began."*  
     *(Giải thích: Đại từ "she" trỏ về "Ms Kamur" vừa thắng giải).*
  4. `[9]` *"These included football, swimming and jumping, and the children had lots of fun."*  
     *(Giải thích: "These" liệt kê cụ thể các "children's activities and competitions").*
  5. `[10]` *"They were all hungry after all of this, so the children had tasty food and drinks with their parents."*  
     *(Giải thích: "after all of this" kết thúc chuỗi hoạt động của ngày hội và chuyển sang ăn uống).*

---

### 3. PART 3: OPINION MATCHING (Nối ý kiến quan điểm)

* **Exam Set ID:** `8b613577-6568-4eee-8814-21a30a4d7e9d`
* **Question ID:** `aca860ff-18c9-46ff-b883-875fe8e098e3`
* **Chủ đề:** *Games from childhood (2026)*

#### Trích dẫn nội dung 4 nhân vật:
* **Person A - Odilia:** Tuổi thơ dành hàng giờ chơi board game vì luật đơn giản, dễ hiểu. Bây giờ làm mẹ, muốn con bớt dùng máy tính nên chơi board game cùng con. Tuy nhiên thấy các game mới rất khó vì nhiều nhân vật và nhiều lựa chọn, phải suy nghĩ rất nhiều dù cả nhà cười rất nhiều khi chơi.
* **Person B - Chris:** May mắn lớn lên ở nơi thời tiết đẹp, thích chạy nhảy ngoài trời cùng bạn bè đồng trang lứa. Có bóng thì đá bóng, không có bóng thì chơi đuổi bắt tới tối. Trải nghiệm đó khiến Chris giờ đây khó chịu khi phải ở một mình, và nhiều người bạn thời thơ ấu đó vẫn là bạn thân đến nay.
* **Person C - Jan:** Hồi nhỏ không thể ra ngoài nhiều (và hiện tại cũng ít ra ngoài). Có rất nhiều sách và say mê với các câu chuyện trong thư viện. Bố mẹ muốn Jan học nghệ thuật/vẽ nhưng Jan không hề có hứng thú. Hiện nay rất thích chơi game vì bị lôi cuốn, chìm đắm vào trò chơi.
* **Person D - Shelly:** Hồi nhỏ thích ra ngoài chơi nhưng trời hay mưa; những ngày mưa thường nhìn ra ngoài cửa sổ buồn bã mong mưa tạnh. Mẹ từng đưa sách nhưng Shelly không thích ngồi yên một chỗ để đọc. Sau đó mẹ đưa bút chì và màu vẽ, Shelly nhận ra mình vẽ rất khá và say sưa vẽ hàng giờ.

#### Bảng đối chiếu nhận định & Đáp án đúng:
| STT | Nhận định (Statement) | Nhân vật | Ký hiệu | Bằng chứng & Phân tích bẫy |
| :---: | :--- | :---: | :---: | :--- |
| **1** | *Who likes modern games?* | **Jan** | **C** | Jan nói: *"These days I really enjoy playing games, because I get so involved in them"*. *(Bẫy: Odilia cũng chơi game mới với con nhưng thấy khó và đau đầu chứ không phải thích).* |
| **2** | *Who finds their childhood games simpler?* | **Odilia** | **A** | Odilia: game hồi nhỏ *"The rules were straightforward and easy to understand"*, còn game bây giờ phức tạp. |
| **3** | *Who preferred reading books when they were a child?* | **Jan** | **C** | Jan: *"I had plenty of books, and the stories really gripped me... completely lost in a book"*. *(Bẫy: Shelly được mẹ đưa sách nhưng ghét ngồi đọc).* |
| **4** | *Who wished to be outside more as a child?* | **Shelly** | **D** | Shelly: thích ra ngoài nhưng hay mưa, *"I would look gloomily out of the window and hope it would stop"*. *(Bẫy: Jan cũng ít ra ngoài nhưng không hề mong muốn ra).* |
| **5** | *Who likes playing with their children?* | **Odilia** | **A** | Odilia: *"I play board games with them... we laugh a lot while we do it"*. |
| **6** | *Who enjoyed doing arts as a child?* | **Shelly** | **D** | Shelly: *"she gave me some pencils and paints instead... I couldn't stop drawing for hours"*. *(Bẫy: bố mẹ Jan muốn Jan học vẽ nhưng Jan ghét).* |
| **7** | *Who enjoyed playing with other children in the past?* | **Chris** | **B** | Chris: *"I loved going outside to play with my peers. We just chased each other around"*. *(Bẫy: Odilia chơi với con mình, không phải bạn bè thời thơ ấu).* |

---

### 4. PART 4: LONG TEXT COMPREHENSION (Nối tiêu đề đoạn văn)

* **Exam Set ID:** `cf4c3915-647d-46da-833d-a2681542326e`
* **Question ID:** `17efa9cc-3703-40f8-ab4b-5debfb7d0b8d`
* **Bài đọc:** *Mountain (Version 5)* — 7 đoạn văn

#### Khớp nối tiêu đề đoạn văn:
| Đoạn (Index) | Tiêu đề đúng (Matched Heading) | Nội dung trọng tâm & Căn cứ xác định |
| :---: | :--- | :--- |
| **Đoạn 1** | **Our changing perspective towards mountains** | So sánh góc nhìn xưa và nay: người ta từng nghĩ leo núi chỉ là thú vui hẹp, nhưng nay coi là thể thao; sự khác biệt hiện tại là định nghĩa "chinh phục" = tự mình đứng trên đỉnh nhìn xuống thay vì qua ảnh/lời kể của người khác. |
| **Đoạn 2** | **A unique sense of achievement** | Cảm giác thành tựu sâu sắc (*profound sense of accomplishment*): đỉnh núi tượng trưng cho sự chinh phục, vượt qua nỗi sợ bản thân và thúc đẩy giới hạn cùng cảm giác hưng phấn adrenaline. |
| **Đoạn 3** | **Publicising one's achievements** | Nhu cầu công khai thành tích: chụp ảnh selfie trên đỉnh thành điều bắt buộc để chứng minh và chia sẻ tức thì lên mạng xã hội (*posted, timestamped and shared*). |
| **Đoạn 4** | **The wrong priority** | Đặt sai ưu tiên: người leo chú trọng vào bức ảnh sống ảo hơn chính ngọn núi, xem hành trình chỉ là chướng ngại, bỏ qua cảnh báo an toàn dẫn đến tai nạn (*personal image ends up mattering more than safety*). |
| **Đoạn 5** | **A disturbing revelation** | Hé lộ thực trạng gây sốc: đỉnh Everest không hề hoang sơ thanh tịnh mà bị "tắc đường" (*traffic jam in the death zone*), hàng dài người xếp hàng và rác thải chất đống mỗi mùa. |
| **Đoạn 6** | **A focus on sustainability** | Tập trung vào tính bền vững: giới hạn số lượng giấy phép leo núi, bắt buộc đặt cọc và chỉ trả lại khi mang rác xuống, tổ chức các chuyến leo chuyên dọn sạch rác thải (*leave cleaner than it was found*). |
| **Đoạn 7** | **A more intimate relationship** | Mối quan hệ gần gũi thân mật: nhà văn Nan Shepherd leo núi như "thăm một người bạn", đi sâu vào các ngóc ngách của núi thay vì chỉ nhắm đến việc leo lên đỉnh để chinh phục. |

---

## 🛠️ III. ĐẶC TẢ CẤU TRÚC DỮ LIỆU & LƯU Ý TÍCH HỢP HỆ THỐNG

### 1. Kiến trúc lưu trữ trong Supabase
* Mỗi đề thi kỹ năng nhỏ (Part) được đại diện bằng một bản ghi trong `exam_sets` (`skill = 'reading'`).
* Toàn bộ câu hỏi của mỗi Part được lưu trong đúng **1 dòng của bảng `exam_questions`**.
* Các thông tin câu hỏi nhỏ, phương án lựa chọn, vị trí đúng, và dữ liệu cấu trúc đều được đóng gói trong cột JSON `extra_data`:
  * **Part 1:** `extra_data.gaps` (mảng các gap chứa `options` và `correct` index).
  * **Part 2:** `extra_data.sentences`, `extra_data.sectionTitles`, `extra_data.givenSentences`.
  * **Part 3:** `extra_data.people`, `extra_data.statements` (chứa `correctPerson`).
  * **Part 4:** `extra_data.paragraphs`, `extra_data.headings` (chứa `paragraphIndex`).

### 2. Tương thích với hệ sinh thái Aptis E-learning của dự án
1. **Tool Ingest / Repair:** Đã có logic unpack cấu trúc này trong file [repair-full-tests.ts](file:///d:/sontayweb/aptis-elearning/backend/scripts/repair-full-tests.ts).
2. **Frontend Render:**
   * Part 1: Render đoạn văn có dropdown/input tại các vị trí `{1}`..`{5}`.
   * Part 2: Render 2 bảng kéo thả sắp xếp câu theo nhóm (đoạn 1 và đoạn 2).
   * Part 3: Render văn bản 4 nhân vật (A, B, C, D) và danh sách 7 câu hỏi chọn radio/dropdown Person.
   * Part 4: Render văn bản 7 đoạn và dropdown chọn tiêu đề cho từng đoạn.
3. **Bổ sung:** Cập nhật nội dung lời giải thích cho Part 1 vào database để đồng bộ với Part 2, 3, 4 đã có lời giải thích hoàn chỉnh.
