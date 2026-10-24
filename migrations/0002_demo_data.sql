-- Migration: 0002_demo_data.sql
-- Dữ liệu mẫu tự sáng tác 100% dành cho TruyenNha

-- 1. Thể loại
INSERT OR IGNORE INTO genres (id, name, slug, description) VALUES
('genre_tienhiep', 'Tiên Hiệp', 'tien-hiep', 'Thể loại tu chân cầu trường sinh, thấu hiểu đạo trời đất'),
('genre_kiemhiep', 'Kiếm Hiệp', 'kiem-hiep', 'Hành hiệp trượng nghĩa, giang hồ ân oán tình thù'),
('genre_dothi', 'Đô Thị', 'do-thi', 'Bối cảnh cuộc sống thành thị đương đại, lập nghiệp và tình cảm'),
('genre_khoahuyen', 'Khoa Huyễn', 'khoa-huyen', 'Khám phá không gian vũ trụ, công nghệ tương lai và trí tuệ nhân tạo'),
('genre_huyenhuyen', 'Huyền Huyễn', 'huyen-huyen', 'Thế giới huyền diệu với ma pháp, thần thú và dị giới kỳ bí'),
('genre_trinhtham', 'Trinh Thám', 'trinh-tham', 'Phá án, suy luận logic, giải mã những bí ẩn ly kỳ');

-- 2. Tác giả tự sáng tác
INSERT OR IGNORE INTO authors (id, name, slug, bio) VALUES
('author_lamvu', 'Lam Vũ', 'lam-vu', 'Cây bút sáng tác truyện Tiên Hiệp và Huyền Huyễn trẻ trung'),
('author_phongtran', 'Phong Trần Khách', 'phong-tran-khach', 'Tác giả chuyên sáng tác các thiên truyện võ hiệp giang hồ tình cảm'),
('author_thanhson', 'Thanh Sơn Lạc', 'thanh-son-lac', 'Tác giả truyện khoa học viễn tưởng và thám hiểm không gian'),
('author_minhnguyet', 'Minh Nguyệt', 'minh-nguyet', 'Tác giả truyện đô thị văn minh, nhẹ nhàng và sâu lắng');

-- 3. Nguồn cấp phép mẫu (Content Sources)
INSERT OR IGNORE INTO content_sources (id, name, slug, provider_type, base_url, is_active, sync_frequency, config_json) VALUES
('source_mock_local', 'Nguồn Sáng Tác Nội Bộ TruyenNha', 'nguon-sang-tac-noi-bo', 'mock_internal', 'https://mock.truyennha.internal/v1', 1, 'manual', '{"allowed_categories": ["all"]}'),
('source_partner_alpha', 'Đối Tác Bản Quyền Alpha (Ví Dụ Cấp Phép)', 'doi-tac-alpha-demo', 'licensed_rest_api', 'https://api-sandbox.partner-alpha.example/v1', 0, 'daily', '{"api_version": "v1", "rate_limit_rpm": 60}');

-- 4. Bộ truyện 1: Đại Đạo Phong Vân Ký (Tiên Hiệp - Published)
INSERT OR IGNORE INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, view_count, updated_at) VALUES
('book_daidao', 'Đại Đạo Phong Vân Ký', 'dai-dao-phong-van-ky', 'author_lamvu', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80', 'Thiếu niên Lý Phong vốn là một đệ tử ngoại môn bình dị tại dãy núi Cửu Long. Một lần tình cờ bước vào phế tích ngàn năm, tìm thấy ngọc giản ghi chép pháp tắc nguyên thủy của trời đất. Từ đây bước lên con đường nghịch thiên tu hành, phá giải bí ẩn phong vân vạn cổ.', 'ongoing', 'published', 'original', 15, '2024-10-20T10:00:00.000Z');

INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES
('book_daidao', 'genre_tienhiep'),
('book_daidao', 'genre_huyenhuyen');

INSERT OR IGNORE INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, attribution_notes) VALUES
('rights_daidao', 'book_daidao', 'Tác giả Lam Vũ', 'Độc quyền phân phối điện tử', 'Toàn quyền hiển thị chương trên web và mobile TruyenNha', 'Toàn cầu', '2024-01-01T00:00:00.000Z', 'verified', 'Tác phẩm tự sáng tác có thỏa thuận cấp phép số TN-2024-001.');

-- Chương truyện Đại Đạo Phong Vân Ký
INSERT OR IGNORE INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, updated_at) VALUES
('chap_dd_1', 'book_daidao', 1, 'Chương 1: Phế tích trong cơn giông', 'chuong-1-phe-tich-trong-con-giong', 
'Dãy núi Cửu Long quanh năm mây mù bao phủ, hôm nay lại đón một cơn bão sét hiếm gặp trong trăm năm.

Sấm chớp rạch ngang bầu trời đêm, chiếu rọi vách đá cheo leo nơi Lý Phong đang bám chặt. Hắn thở hổn hển, cả người ướt sũng nước mưa. Là một thiếu niên mười sáu tuổi chỉ có tu vi Luyện Khí tầng hai, việc trèo lên ngọn Phong Lôi Thạch vốn dĩ là điều không tưởng. Nhưng vì tìm kiếm một cây Nguyệt Linh Thảo để chữa bệnh phong hàn cho muội muội, hắn không còn cách nào khác.

"Rắc!"

Một tiếng nứt giòn tan vang lên dưới chân. Tảng đá mục nát không chịu nổi sức nặng, lập tức sụp đổ. Lý Phong hét lên một tiếng, thân hình rơi tự do vào vực thẳm sâu hun hút.

Gió rít bên tai như xé toạc màng nhĩ. Ngay khi nghĩ mạng mình khó giữ, lưng hắn va mạnh vào một tầng sương mềm mại vô hình, làm tiêu tán đi toàn bộ xung lực. Lý Phong trượt dài trên một thềm đá phủ rêu xanh ngắt.

Hắn run rẩy đứng dậy, ngước nhìn xung quanh. Đây không phải đáy vực, mà là một hang động cổ xưa ẩn sâu trong lòng núi. Giữa hang đá, một bệ ngọc tròn phát ra ánh sáng lam nhạt dịu dàng, xua tan bóng tối mịt mùng. Trên bệ ngọc, một khối thẻ ngọc cổ kính nằm yên tĩnh suốt hàng ngàn năm như chờ đợi người hữu duyên.

Lý Phong chậm rãi tiến lại gần. Hắn vươn bàn tay run rẩy chạm vào phiến ngọc.

"Oanh!"

Một luồng khí tức mênh mông như biển cả ùa thẳng vào thức hải. Tám chữ cổ tự phát sáng rực rỡ hiện lên giữa tâm trí:

"Đạo tại tâm thần, Phong Vân vạn biến."

Số phận của thiếu niên bình thường, từ khoảnh khắc này chính thức lật sang trang mới.', 420, 'published', '2024-10-20T10:00:00.000Z'),

('chap_dd_2', 'book_daidao', 2, 'Chương 2: Ngưng tụ Luyện Khí Quyết', 'chuong-2-ngung-tu-luyen-khi-quyet', 
'Luồng nhiệt lưu ấm áp lan tỏa từ lòng bàn tay chạy dọc theo mười hai đường kinh mạch chính, xua tan cái lạnh thấu xương của cơn mưa bão ngoài trời.

Lý Phong ngồi xếp bằng trên bệ đá, hai mắt nhắm nghiền, tập trung cảm thụ biến chuyển kỳ diệu trong cơ thể. Những câu kinh văn cổ xưa từ ngọc giản như tự động khắc sâu vào linh hồn hắn. Đây chính là "Hỗn Nguyên Phong Lôi Quyết" thất truyền từ thời thượng cổ!

Khác với công pháp thông thường chỉ tu luyện một thuộc tính, bộ công pháp này lấy tâm trí làm gốc, dung nạp linh khí đất trời chuyển hóa thành Phong Lôi chi lực. Từng tia linh khí loãng trong hang động bắt đầu tụ lại quanh người thiếu niên, xoay vòng tạo thành một cơn lốc xoáy nhỏ màu thiên thanh.

"Bụp!"

Một tiếng vang trầm đục phát ra từ đan điền. Rào cản bấy lâu nay giam hãm hắn ở Luyện Khí tầng hai bỗng chốc vỡ tan.

Luyện Khí tầng ba!

Chưa dừng lại ở đó, luồng linh lực tinh khiết tiếp tục cọ rửa từng tế bào, gột rửa tạp chất trong xương tủy. Cho đến khi bình minh ló rạng, ánh nắng đầu tiên xuyên qua kẽ đá soi rọi khuôn mặt thanh tú của hắn, khí tức của Lý Phong đã vững vàng đứng ở đỉnh phong Luyện Khí tầng ba.

Hắn mở mắt, đôi con ngươi ánh lên tia chớp xanh nhạt đầy vẻ kiên định:
"Muội muội, huynh đã có sức mạnh bảo vệ muội rồi!"', 380, 'published', '2024-10-20T11:00:00.000Z'),

('chap_dd_3', 'book_daidao', 3, 'Chương 3: Trở về Tông Môn', 'chuong-3-tro-ve-tong-mon', 
'Dưới chân núi Cửu Long, Thanh Vân Tông hiện ra giữa những rặng tùng cổ thụ. Những tòa lâu các mái cong lợp ngói lưu ly óng ánh trong sương sớm.

Lý Phong mang theo cây Nguyệt Linh Thảo hái được cùng túi áo rách rưới bước qua cổng sơn môn. Trái ngược với dự liệu của hắn, quảng trường hôm nay đông nghẹt đệ tử ngoại môn đang xôn xao bàn tán.

"Nghe nói đại hội khảo thí ba năm một lần đã được đẩy lên sớm hơn ba tháng!"
"Lần này nếu không qua được ải kiểm tra căn cốt, toàn bộ sẽ bị giáng làm tạp dịch phục vụ linh điền!"

Tiếng xì xào vang lên khắp nơi. Bỗng nhiên, một giọng nói khinh khỉnh truyền đến từ phía sau lưng Lý Phong:
"Ồ, xem ai trở về này? Lý Phong, ngươi đi nhặt rác cả đêm không về, chẳng lẽ định lấy cớ đó để trốn buổi sát hạch sáng nay sao?"

Lý Phong quay đầu lại, nhìn thấy Triệu Bằng — đệ tử ngoại môn cậy có thúc phụ làm chấp sự mà luôn ức hiếp các đệ tử yếu thế. Ánh mắt Lý Phong bình tĩnh khác thường, không còn vẻ nhút nhát như mọi ngày.

"Triệu sư huynh, nhặt rác hay hái thuốc là việc riêng của ta. Buổi sát hạch ta tự khắc sẽ tham gia, không phiền huynh bận tâm."

Dứt lời, Lý Phong sải bước đi thẳng về khu nhà trọ, bỏ lại ánh mắt kinh ngạc xen lẫn tức tối của Triệu Bằng.', 350, 'published', '2024-10-20T12:00:00.000Z');

-- 5. Bộ truyện 2: Gió Ngang Phố Cổ (Đô Thị - Published)
INSERT OR IGNORE INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, view_count, updated_at) VALUES
('book_giongang', 'Gió Ngang Phố Cổ', 'gio-ngang-pho-co', 'author_minhnguyet', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', 'Hà Nội những ngày chuyển mùa với những cơn gió heo may dịu dàng. Tuấn Vũ rời bỏ công ty phần mềm đa quốc gia để về mở một quán trà nhỏ trên phố Hàng Mã. Cuộc sống bình lặng của anh bỗng thay đổi khi gặp lại Nhã Uyên - người bạn thời niên thiếu mang trong lòng một bí mật chưa từng thổ lộ.', 'ongoing', 'published', 'original', 28, '2024-10-19T14:00:00.000Z');

INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES
('book_giongang', 'genre_dothi');

INSERT OR IGNORE INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, attribution_notes) VALUES
('rights_giongang', 'book_giongang', 'Tác giả Minh Nguyệt', 'Cấp phép phát hành tác phẩm', 'Độc quyền bản số trên TruyenNha', 'Toàn cầu', '2024-02-15T00:00:00.000Z', 'verified', 'Bản quyền văn bản tự sáng tác hợp lệ.');

INSERT OR IGNORE INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, updated_at) VALUES
('chap_gn_1', 'book_giongang', 1, 'Chương 1: Mùi hoa sữa đầu mùa', 'chuong-1-mui-hoa-sua-dau-mua', 
'Mùi hoa sữa đầu mùa thoang thoảng bay qua con ngõ nhỏ ngoằn ngoèo trên phố Hàng Mã.

Tuấn Vũ kéo cánh cửa gỗ cũ kỹ của quán trà "Góc Nhỏ", khẽ hít một hơi thật sâu. Không khí se lạnh của buổi sáng chớm thu Hà Nội luôn có cách làm lòng người dịu lại sau những xô bồ mệt mỏi. Ba tháng trước, anh đặt lá đơn từ chức xuống bàn làm việc của sếp tổng tại tòa nhà chọc trời Cầu Giấy, đổi lấy chiếc tạp dề vải thô và những ấm trà sen thơm ngát.

Nhiều người nói anh dại. Tuổi ba mươi mốt, lương nghìn đô, vị trí trưởng nhóm kỹ sư mà bao người mơ ước, bỗng chốc buông xuôi để làm một gã bán trà. Nhưng chỉ có Vũ mới hiểu, những đêm thức trắng trước màn hình máy tính với những cơn đau dạ dày quằn quại đã bào mòn tâm hồn anh đến mức nào.

"Keng..."

Chiếc chuông gió bằng đồng treo trước cửa khẽ rung. Một vị khách bước vào trong chiếc áo khoác len màu be nhạt, trên vai còn đọng vài hạt mưa bụi li ti.

"Quán đã mở cửa chưa anh?"

Giọng nói quen thuộc vang lên khiến bàn tay đang lau tách trà của Vũ khựng lại. Anh ngẩng đầu lên, đối diện với đôi mắt trong veo hơi ngỡ ngàng của cô gái đối diện.

"Nhã Uyên... phải em không?"', 360, 'published', '2024-10-19T14:00:00.000Z'),

('chap_gn_2', 'book_giongang', 2, 'Chương 2: Tách trà sen hội ngộ', 'chuong-2-tach-tra-sen-hoi-ngo', 
'Khói trà bốc lên nghi ngút, mang theo hương thơm thuần khiết của gạo sen Tây Hồ được ướp kỳ công.

Nhã Uyên áp hai bàn tay vào thân cốc gốm Bát Tràng, cảm nhận hơi ấm len lỏi qua từng đầu ngón tay. Mười năm không gặp, người bạn cùng bàn năm xưa giờ đã có vài sợi tóc bạc mai, nhưng ánh nhìn hiền từ và nụ cười ấm áp thì vẫn vẹn nguyên như ngày tốt nghiệp trường Bưởi.

"Thế giới này quả thật nhỏ bé, không ngờ lại gặp anh ở đây," Uyên mỉm cười, nét mặt lộ rõ sự xúc động. "Em vừa chuyển công tác về viện thiết kế gần bờ hồ, sáng nay đi dạo ngắm phố tình cờ thấy biển hiệu quán."

"Anh cũng không nghĩ chúng ta lại gặp lại nhau trong hoàn cảnh này," Vũ rót thêm trà cho cô. "Nghe nói những năm qua em ở Pháp?"

Ánh mắt Uyên khẽ chùng xuống trong thoáng chốc, rồi nhanh chóng lấy lại vẻ tự nhiên:
"Vâng, Paris đẹp nhưng xa xôi quá. Đi xa rồi mới thấy không đâu bình yên bằng những buổi sáng ngửi mùi hoa cúc, hoa sữa ở quê nhà."

Bên ngoài hiên quán, tiếng lá vàng rơi xào xạc theo từng đợt gió heo may.', 340, 'published', '2024-10-19T15:00:00.000Z');

-- 6. Bộ truyện 3: Bí Mật Tinh Cầu Lam (Khoa Huyễn - Published)
INSERT OR IGNORE INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, view_count, updated_at) VALUES
('book_tinhcaulam', 'Bí Mật Tinh Cầu Lam', 'bi-mat-tinh-cau-lam', 'author_thanhson', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', 'Năm 2280, tàu khảo sát viễn thám Sao Mai phát hiện một tín hiệu điều hòa nhân tạo phát ra từ độ sâu 5000 mét dưới lớp băng dày của vệ tinh Europa. Nhà địa vật lý Vũ Kiên cùng phi hành đoàn bước vào hành trình giải mã bí mật có thể thay đổi vận mệnh toàn nhân loại.', 'ongoing', 'published', 'original', 42, '2024-10-18T09:00:00.000Z');

INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES
('book_tinhcaulam', 'genre_khoahuyen');

INSERT OR IGNORE INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, attribution_notes) VALUES
('rights_tinhcaulam', 'book_tinhcaulam', 'Tác giả Thanh Sơn Lạc', 'Giấy phép độc quyền xuất bản số', 'Toàn bộ phiên bản điện tử', 'Toàn cầu', '2024-03-01T00:00:00.000Z', 'verified', 'Tác phẩm tự sáng tác khoa học viễn tưởng hợp pháp.');

INSERT OR IGNORE INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, updated_at) VALUES
('chap_tcl_1', 'book_tinhcaulam', 1, 'Chương 1: Tín hiệu dưới tầng băng', 'chuong-1-tin-hieu-duoi-tang-bang', 
'Trạm quan sát liên hành tinh Sao Mai nằm lặng lẽ trong quỹ đạo quanh sao Mộc.

Qua ô cửa sổ kính chịu lực nano, Mộc Tinh khổng lồ với cơn bão Mắt Đỏ vĩ đại trông như một bức tranh sơn dầu ma mị xoay tròn giữa vũ trụ tối tăm. Vũ Kiên ngồi trước bàn điều khiển ba chiều, nhấp một ngụm cà phê tổng hợp nhạt thếch.

"Kiên, cậu nên lại đây xem cái này."

Giọng của tiến sĩ Anna vang lên từ khoang phân tích phổ sóng vô tuyến. Kiên đặt cốc nước xuống, bước nhanh qua hành lang trọng lực nhân tạo.

Trên màn hình holographic, một dải sóng hình sin đang dao động với tần số 1420 MHz — tần số hydro trung tính kinh điển mà các nhà thiên văn học thế kỷ 20 từng kỳ vọng dùng để liên lạc với nền văn minh ngoài Trái Đất.

"Nó xuất phát từ đâu?" Kiên hỏi, đồng tử co lại.
"Vệ tinh Europa. Chính xác hơn là tọa độ 34 độ Bắc, sâu 4.800 mét dưới thềm băng cổ đại," Anna phóng to bản đồ địa hình vệ tinh. "Và đây không phải nhiễu xạ tự nhiên. Tín hiệu này mã hóa một chuỗi số nguyên tố lặp lại mỗi 17 giây."

Một cảm giác ớn lạnh chạy dọc sống lưng Kiên. Dưới lòng đại dương tối đen và băng giá hàng triệu năm kia, có một thứ gì đó vừa thức giấc.', 390, 'published', '2024-10-18T09:00:00.000Z');

-- 7. Bộ truyện 4: Thanh Phong Tàn Kiếm (Kiếm Hiệp - Completed)
INSERT OR IGNORE INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, view_count, updated_at) VALUES
('book_thanhphong', 'Thanh Phong Tàn Kiếm', 'thanh-phong-tan-kiem', 'author_phongtran', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80', 'Giang hồ dậy sóng vì thanh tàn kiếm gãy đôi lưu truyền từ trận huyết chiến Tương Dương. Lãng tử Diệp Thanh tay cầm bầu rượu, vung kiếm giữa mưa đao gió kiếm để tìm lại công lý cho sư môn đã bị diệt vong trong một đêm.', 'completed', 'published', 'original', 56, '2024-10-15T08:00:00.000Z');

INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES
('book_thanhphong', 'genre_kiemhiep');

INSERT OR IGNORE INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, attribution_notes) VALUES
('rights_thanhphong', 'book_thanhphong', 'Tác giả Phong Trần Khách', 'Giấy phép tác giả phân phối', 'Hiển thị công khai miễn phí', 'Việt Nam', '2024-01-10T00:00:00.000Z', 'verified', 'Ủy quyền văn học kiếm hiệp sáng tác trực tiếp.');

INSERT OR IGNORE INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, updated_at) VALUES
('chap_tp_1', 'book_thanhphong', 1, 'Chương 1: Mưa gió quán trọ biên thùy', 'chuong-1-mua-gio-quan-tro-bien-thuy', 
'Trời sẩm tối, cơn mưa rào biên ải trút xuống mái ngói quán trọ Hoàng Lạc như trút nước.

Trong quán trọ đơn sơ, mùi rượu ngô cay nồng quyện với mùi thịt bò khô. Mấy bàn khách buôn ngựa và tiêu sư ngồi quây quần bên đống lửa, thi thoảng liếc nhìn về phía góc tối nơi một thanh niên áo xanh đang ngồi một mình.

Bên cạnh hắn là một thanh kiếm bọc trong vải bố sờn rách, chuôi kiếm bằng đồng đen mòn vẹt vì năm tháng. Hắn khẽ nâng chén rượu sứ sứt miệng lên môi, uống cạn từng ngụm chậm rãi.

"Cạch!"

Cánh cửa quán trọ bị đạp tung, gió lạnh thổi ùa vào làm tắt ngấm ngọn đèn dầu giữa sảnh. Ba gã đàn ông lực lưỡng bước vào, tay lăm lăm đại đao sáng loáng, sát khí đằng đằng:

"Thằng nhóc họ Diệp đâu, mau giao nửa mảnh Kiếm Phổ ra đây, lão tử cho ngươi toàn thây!"

Diệp Thanh không buồn ngẩng đầu. Hắn đặt chén rượu rỗng xuống bàn, ngón tay khẽ gõ lên chuôi kiếm:
"Đao của các ngươi quá chậm, không cứu nổi mạng mình đâu."', 330, 'published', '2024-10-15T08:00:00.000Z');

-- 8. Bộ truyện 5: Bản Thảo Giả Kim Thuật (Draft - Để test bảo mật API không lọt dữ liệu chưa xuất bản)
INSERT OR IGNORE INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, view_count, updated_at) VALUES
('book_draft_giakim', 'Bản Thảo Giả Kim Thuật', 'ban-thao-gia-kim-thuat', 'author_thanhson', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80', 'Bộ truyện đang trong giai đoạn phác thảo nội dung và chưa được phê duyệt xuất bản. Bản nháp này dùng để thẩm định và kiểm thử bảo mật.', 'ongoing', 'draft', 'original', 0, '2024-10-21T00:00:00.000Z');

INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES
('book_draft_giakim', 'genre_huyenhuyen');

INSERT OR IGNORE INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, updated_at) VALUES
('chap_draft_1', 'book_draft_giakim', 1, 'Chương 1: Bản nháp thử nghiệm tuyệt mật', 'chuong-1-ban-nhap-thu-nghiem-tuyet-mat', 
'Nội dung bản nháp thử nghiệm chưa xuất bản. Chỉ tài khoản quản trị viên hoặc biên tập viên mới có thể thấy nội dung này khi đăng nhập. API công khai phải hoàn toàn từ chối hoặc trả về 404.', 80, 'draft', '2024-10-21T00:00:00.000Z');
