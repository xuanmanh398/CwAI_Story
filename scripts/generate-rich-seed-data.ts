import * as fs from 'fs';
import * as path from 'path';

// Template và các đoạn văn học bản địa hóa chất lượng cao cho từng thể loại
export interface RawNovelDef {
  title: string;
  slug: string;
  author: string;
  genreSlug: string;
  cover: string;
  description: string;
  chapters: {
    num: number;
    title: string;
    setting: string;
    events: string[];
    dialogues: { speaker: string; text: string }[];
    climax: string;
    cliffhanger: string;
  }[];
}

export function generateChapterText(
  novelTitle: string,
  author: string,
  genreSlug: string,
  chapterNum: number,
  chapterTitle: string,
  summary: string
): string {
  // Sinh nội dung trường thiên từ 600 - 1000 chữ thuần Việt, ngắt dòng chuẩn văn học
  const paragraphs: string[] = [];

  if (genreSlug === 'tien-hiep') {
    paragraphs.push(
      `Thiên địa mịt mờ, vạn vật giai hữu linh tính. Trên đỉnh Thiên Phong nghìn năm mây phủ, từng luồng hàn khí thấu xương từ phương bắc tràn về cuộn xiết quanh những vách đá dựng đứng như gươm tuốt khỏi vỏ. Đứng giữa mịt mùng tuyết trắng, bóng hình người tu đạo vẫn sừng sững như một thân tùng cổ thụ, hô hấp trầm ổn từng nhịp hòa vào quy luật vận hành của càn khôn.`
    );
    paragraphs.push(
      `Trong đan điền, khí hải cuộn trào như sóng cồn. Những sợi linh khí tử kim mỏng như tơ nhện bắt đầu lưu chuyển men theo mười hai đường kinh mạch chính, gột rửa đi từng chút tạp chất phàm trần còn sót lại. Cơn đau nhức nhối từ cốt tủy truyền tới khiến trán hắn rịn ra một tầng mồ hôi lạnh, nhưng ánh mắt kiên định vẫn không hề dao động dù chỉ một tia.`
    );
    paragraphs.push(
      `— "Tu giả nghịch thiên nhi hành, nếu ngay cả một tia trắc trở này cũng không vượt qua nổi, lấy tư cách gì mưu cầu trường sinh bất tử?" — Tiếng nói trầm thấp vang lên tựa như sấm rền trong tâm khảm, chấn động cả linh hồn.`
    );
    paragraphs.push(
      `Thời khắc ấy, một đạo thanh quang từ phương xa xé toạc màn sương mù mịt lao thẳng tới. Tiếng kiếm ngân trong trẻo vang vọng khắp thung lũng, kéo theo uy áp kinh người của bậc cường giả ngoại cảnh. Hóa ra là đệ tử chấp pháp của tông môn đã phát hiện ra dị tượng lôi đình nơi hoang cốc hoang phế này.`
    );
    paragraphs.push(
      `— "Người phương nào dám lén lút tu luyện cấm thuật tại sơn môn Thái Sơ? Mau mau thúc thủ chịu trói, bằng không một kiếm này hạ xuống ắt khiến hồn phi phách tán!" — Tiếng quát lạnh lùng của vị chấp pháp trưởng lão vang dội như chuông đồng, kiếm ảnh hóa thành chín đóa liên hoa màu lam vây bọc tứ phía.`
    );
    paragraphs.push(
      `Đối diện với sát cơ bao trùm, hắn không những không lùi bước mà trái lại, khóe môi khẽ nhếch lên một nụ cười ngạo nghễ. Chân khí trong cơ thể bỗng chốc đảo nghịch, thần cách thượng cổ bấy lâu nay phong ấn trong thức hải đột ngột bừng sáng như vầng thái dương mới mọc giữa đêm trường u tối.`
    );
    paragraphs.push(
      `Một tiếng nổ kinh thiên động địa vang lên xé rách không gian, dư ba cuồng bạo thổi tung lớp tuyết dày nghìn thước dưới chân núi. Và đó cũng chính là khoảnh khắc mở ra một huyền thoại mới chấn động cửu thiên thập địa...`
    );
  } else if (genreSlug === 'kiem-hiep') {
    paragraphs.push(
      `Gió thu hiu hắt thổi qua rặng liễu tiêu điều bên bờ Lạc Thủy. Hoàng hôn buông xuống nhuộm đỏ cả một góc trời tây, phủ lên mặt sông phẳng lặng một màu huyết sắc thê lương. Dưới mái đình rêu phong cũ kỹ, một người một kiếm lẳng lặng ngồi đó, chén rượu nhạt trên tay đã nguội tự bao giờ.`
    );
    paragraphs.push(
      `Giang hồ hiểm ác, lòng người khó lường. Mười năm trước, trận huyết chiến kinh hoàng trên đỉnh Nhạn Đãng Sơn đã chôn vùi biết bao hào kiệt võ lâm, cũng khiến môn phái vang danh một thời tan thành tro bụi chỉ sau một đêm mưa máu. Mối thù diệt môn khắc sâu vào tận tâm can, ngày đêm gặm nhấm linh hồn lãng tử.`
    );
    paragraphs.push(
      `Bỗng nhiên, tiếng vó ngựa dồn dập từ phía quan đạo vọng lại, phá tan bầu không khí tĩnh mịch của buổi chiều tà. Bảy bóng đen bịt mặt mang theo đao thương sắc lạnh phi ngựa như bay, bụi cuốn mù mịt, sát khí nồng nặc lan tỏa trong không trung.`
    );
    paragraphs.push(
      `— "Họ Tiêu kia! Chạy trốn mười năm nay, hôm nay chính là ngày tàn của ngươi! Mau giao nộp bí kíp võ công của môn phái ra đây, các chủ sẽ ban cho ngươi một cái chết toàn thây!" — Tên thủ lĩnh hắc y nhân rút phăng thanh quỷ đầu đao, hàn quang lấp loáng chỉ thẳng vào đình trung.`
    );
    paragraphs.push(
      `Hắn khẽ thở dài, từ từ đặt chén sứ xuống mặt bàn đá nứt nẻ. Tay phải khẽ chạm vào chuôi kiếm đã sờn rách vải bọc. Không có bất kỳ lời đáp trả nào, chỉ có tiếng kim loại ma sát trầm đục khi lưỡi thép sắc bén chậm rãi rời khỏi vỏ.`
    );
    paragraphs.push(
      `Kiếm quang lóe lên như lằn chớp xé toạc màn hoàng hôn! Thân pháp tựa như mộng ảo phong trần, ba bước qua đầu ngựa, một kiếm định càn khôn. Máu tươi bắn tung tóe trên nền cỏ úa, những kẻ hung bạo chưa kịp nhận ra đường kiếm từ đâu tới thì đã ngã rạp dưới chân.`
    );
    paragraphs.push(
      `Tra kiếm vào vỏ, hắn lại nâng bầu rượu lên nhấp một ngụm cay nồng, rồi quay lưng bước vào màn sương đêm mịt mùng. Con đường phía trước còn muôn trùng cạm bẫy, nhưng bước chân hiệp nghĩa chưa từng biết đến hai chữ chùn lòng.`
    );
  } else if (genreSlug === 'do-thi') {
    paragraphs.push(
      `Ánh đèn đường màu hổ phách hắt hiu rọi xuống những con phố dài ướt đẫm sau cơn mưa rào bất chợt của thành phố. Dòng xe cộ tấp nập hối hả ngược xuôi mang theo những ước mơ, trăn trở và cả những gánh nặng mưu sinh của hàng triệu con người giữa chốn phồn hoa đô hội.`
    );
    paragraphs.push(
      `Ngồi bên ô cửa kính của quán cà phê góc phố, những ký ức của chuỗi ngày lập nghiệp gian nan lại ùa về rõ nét. Mười năm trước, bước chân lên đất Sài Gòn với hai bàn tay trắng cùng một chiếc ba lô sờn cũ, đã có những đêm đông buốt giá phải chia nhau từng gói mì tôm nơi căn phòng trọ chật hẹp chưa đầy mười mét vuông.`
    );
    paragraphs.push(
      `— "Thất bại không đáng sợ, đáng sợ nhất là khi người ta không còn đủ dũng khí để bắt đầu lại từ đầu." — Lời dặn dò chân thành của người thầy năm xưa nơi giảng đường y khoa vẫn luôn là kim chỉ nam soi sáng từng quyết định sinh tử của cuộc đời anh.`
    );
    paragraphs.push(
      `Tiếng chuông điện thoại khẩn cấp vang lên phá vỡ dòng suy nghĩ. Đầu dây bên kia là giọng nói gấp gáp của cô y tá trực phòng cấp cứu bệnh viện đa khoa: "Bác sĩ ơi, có ca tai nạn liên hoàn trên quốc lộ chuyển viện gấp, bệnh nhân mạch yếu, mất máu nhiều, viện trưởng chỉ định anh trực tiếp cầm dao mổ chính!"`
    );
    paragraphs.push(
      `Không một giây do dự, anh bật dậy, vội vã khoác lên mình chiếc áo blouse trắng tinh khôi rồi lao nhanh ra màn đêm. Đối với người thầy thuốc, mỗi giây phút trôi qua không chỉ là cuộc đua với thời gian, mà còn là ranh giới mong manh giữa sự sống và cái chết của một kiếp người.`
    );
    paragraphs.push(
      `Bước vào phòng phẫu thuật dưới ánh đèn mổ trắng lóa, mọi lo toan bộn bề của cuộc sống đời thường bỗng tan biến hoàn toàn. Trong ánh mắt kiên định của người bác sĩ chỉ còn lại sự tập trung cao độ, đôi bàn tay vững vàng nắm chặt cán dao phẫu thuật, sẵn sàng giành giật sự sống từ tay tử thần...`
    );
  } else if (genreSlug === 'khoa-huyen') {
    paragraphs.push(
      `Không gian sâu thẳm ngoài quỹ đạo sao Hỏa chìm trong sự im lặng tuyệt đối của vũ trụ. Trạm nghiên cứu không gian Vọng Thiên lơ lửng như một đài sen cơ khí khổng lồ bằng hợp kim titan, những tấm pin mặt trời đa tinh thể chậm rãi xoay chuyển theo góc chiếu của ngôi sao mẹ xa xôi.`
    );
    paragraphs.push(
      `Bên trong buồng điều khiển trung tâm, hàng trăm màn hình ba chiều đang nhấp nháy những biểu đồ sóng điện từ dị thường. Trí tuệ nhân tạo thế hệ thứ tư - NOVA - phát ra giọng nói điện tử tổng hợp đều đều nhưng ẩn chứa sự cảnh báo nghiêm trọng: "Phát hiện chấn động không-thời gian bậc bảy tại tọa độ 42-Omega. Thời gian va chạm dự kiến: ba phút."`
    );
    paragraphs.push(
      `— "Toàn trạm kích hoạt trường lực phòng hộ năng lượng plasma! Khởi động lò phản ứng nhiệt hạch dự phòng ngay lập tức!" — Thuyền trưởng Minh Quân hạ lệnh dứt khoát, ngón tay thoăn thoắt kích hoạt chuỗi mã chỉ huy tối mật trên bảng điều khiển lượng tử.`
    );
    paragraphs.push(
      `Bên ngoài cửa sổ quan sát vòm kính, một vết rách đen ngòm khổng lồ đang từ từ mở ra giữa chân không vũ trụ. Từ trong xoáy đen vô tận ấy, những mảnh vỡ kim loại mang ký tự phát quang kỳ lạ của một nền văn minh ngoài hành tinh đã biến mất hàng triệu năm trước bắt đầu trôi dạt vào tầm quét radar.`
    );
    paragraphs.push(
      `— "Thưa thuyền trưởng, đây không phải thiên thạch tự nhiên! Tín hiệu phản hồi có cấu trúc chuỗi ADN sinh học kết hợp nano cơ khí. Có thứ gì đó... đang thức tỉnh bên trong khối tàn tích!" — Giọng của chuyên viên kỹ thuật run lên bần bật khi nhìn vào biểu đồ nhịp tim sinh học ngoài hành tinh.`
    );
    paragraphs.push(
      `Trước mắt họ không còn đơn thuần là một cuộc thám hiểm không gian thường lệ, mà là cánh cửa dẫn tới bí mật cội nguồn của sự sống trong dải Ngân Hà. Một kỷ nguyên mới đầy hiểm nguy và biến động của nhân loại chính thức bắt đầu từ khoảnh khắc định mệnh này...`
    );
  } else if (genreSlug === 'huyen-huyen') {
    paragraphs.push(
      `Lục địa ma pháp Aethelgard trải dài dưới ánh trăng máu kỳ dị, những cánh rừng cổ thụ ngàn năm rủ bóng ma mị trên những phế tích đền đài đổ nát. Gió đêm hú dài qua những hẻm núi đá hoa cương, mang theo mùi lưu huỳnh nồng nặc báo hiệu sự trỗi dậy của loài sinh vật bóng đêm viễn cổ.`
    );
    paragraphs.push(
      `Trên đỉnh tháp chuông đổ nát của pháo đài Ravenclaw, một thiếu niên khoác áo choàng đen đứng lặng nhìn về phía đường chân trời rực lửa. Trong lồng ngực hắn, quả tim mang dòng máu thần duệ rực cháy như than hồng, phong ấn cấm kỵ của gia tộc suốt trăm năm qua đã bắt đầu rạn nứt từng kẽ nhỏ.`
    );
    paragraphs.push(
      `— "Kẻ mang huyết mạch của Cự Long viễn cổ, ngươi không thể chạy trốn mãi khỏi định mệnh của vương tọa lửa và máu!" — Tiếng gầm trầm đục phát ra từ sâu trong hư không, kèm theo đôi mắt vàng rực to lớn như hai vầng trăng khuyết ẩn hiện sau tầng mây xám xịt.`
    );
    paragraphs.push(
      `Một tiếng gầm thét xé toạc không gian, chú ngữ ma pháp cổ đại vang lên từng âm tiết trầm hùng. Mặt đất dưới chân bắt đầu rung chuyển dữ dội, những ký tự rune ma pháp màu xanh lam bừng sáng tạo thành một ma pháp trận bảo vệ đường kính nghìn trượng ngăn cản bầy dơi quỷ khổng lồ đang lao xuống.`
    );
    paragraphs.push(
      `Thanh đại kiếm phong ấn thần khí trong tay hắn bỗng nhiên rung lên bần bật, lưỡi kiếm bùng cháy ngọn lửa màu tử kim thiêu rụi màn đêm. Ánh mắt hắn không còn vẻ ngây ngô non nớt của một đứa trẻ mồ côi, mà ngập tràn dũng khí và uy áp của bậc đế vương tái sinh giữa tro tàn thế giới.`
    );
    paragraphs.push(
      `Chiến ca vang vọng giữa đất trời cuồng loạn. Chàng hiệp sĩ trẻ nâng cao lưỡi kiếm hướng thẳng lên trời xanh, nghênh đón bão tố định mệnh với niềm kiêu hãnh bất diệt của loài rồng bất tử...`
    );
  } else {
    // Trinh thám
    paragraphs.push(
      `Cơn mưa dầm dề dai dẳng suốt ba ngày đêm phủ lên Cố đô một màn sương mờ ảo tịch mịch. Tiếng chuông chùa Thiên Mụ ngân nga từng hồi trầm buồn hòa vào tiếng nước sông Hương vỗ bì bọp vào những mạn thuyền nan neo đậu bên bến Văn Lâu.`
    );
    paragraphs.push(
      `Hiện trường vụ án mạng nằm sâu trong một con hẻm cổ kính lát đá xanh của phường Kim Long. Ngôi nhà rường ba gian cổ kính với những hàng cột gỗ lim chạm trổ rồng phượng tinh xảo giờ đây bị phong tỏa nghiêm ngặt bởi những dải băng vàng của lực lượng điều tra trọng án.`
    );
    paragraphs.push(
      `Nạn nhân là một vị học giả lão thành ngoài bảy mươi tuổi, chuyên gia hàng đầu về giải mã văn bia và đồ cổ triều Nguyễn. Ông ngồi bất động trên chiếc ghế tựa bọc gấm, đôi mắt mở trừng trừng nhìn vào khoảng không vô định, trên bàn trà trước mặt là một bức phong thư cổ chưa kịp niêm phong mang hoa văn ấn tín kỳ lạ.`
    );
    paragraphs.push(
      `— "Bác sĩ pháp y đã có kết luận sơ bộ chưa?" — Đại úy Nam, điều tra viên kỳ cựu của đội trọng án trầm giọng hỏi người đồng nghiệp đang tỉ mỉ thu thập những dấu vết phấn hoa vương vãi trên nền gạch tàu.`
    );
    paragraphs.push(
      `— "Không có dấu hiệu xô xát hay thương tích ngoại lực. Đồng tử co nhỏ, khóe môi có vết tím tái mờ nhạt nghi do trúng độc chiết xuất từ một loài thảo mộc cực hiếm vùng rừng Bạch Mã. Thời gian tử vong vào khoảng giữa canh ba đêm qua, chính xác lúc cơn mưa giông lớn nhất ập tới." — Người bác sĩ pháp y thận trọng trả lời.`
    );
    paragraphs.push(
      `Khi lật mở cuốn sổ tay nghiên cứu bị giấu kín dưới đáy ngăn kéo bí mật, đại úy Nam phát hiện một dãy số mật mã gồm mười hai chữ số viết bằng mực tàu cổ, kèm theo một dòng chữ vội vã cuối cùng: "Kẻ mang mặt nạ hoa mai đã tìm thấy lối vào mật thất..."`
    );
    paragraphs.push(
      `Một cơn gió lạnh bất ngờ thổi thốc qua khe cửa sổ làm ngọn nến le lói chao đảo rồi phụt tắt. Trong bóng tối đặc quánh, tiếng bước chân khẽ khàng trên mái ngói rêu phong khiến mọi giác quan của người chiến sĩ công an bỗng căng như dây đàn...`
    );
  }

  return paragraphs.join('\n\n');
}
