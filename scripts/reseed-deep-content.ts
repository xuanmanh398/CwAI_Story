import { SEED_50_NOVELS, SeedNovel } from '../server/data/seed-novels';
import * as fs from 'fs';
import * as path from 'path';

// Helper tạo nội dung chương trường thiên hoàn chỉnh theo ngữ cảnh truyện
function buildDeepChapterContent(
  novel: SeedNovel,
  chapterNum: number,
  chapterTitle: string,
  baseText: string
): string {
  const g = novel.genreSlug;
  const t = novel.title;
  const a = novel.author;

  const intro = baseText && baseText.length > 50 ? baseText : '';

  if (g === 'tien-hiep') {
    return `${intro ? intro + '\n\n' : ''}Màn đêm buông xuống trên rặng Thiên Sơn, tuyết trắng phủ ngập những lối mòn dẫn lên đỉnh phong nghìn trượng. Gió bấc rít từng hồi qua khe đá nhọn hoắt tựa kiếm kích tuốt khỏi vỏ, rít lên từng tràng ai oán. Giữa không gian hoang vu vắng lặng, bóng hình một thiếu niên đơn bạc kiên định quỳ trước cổng đá sơn môn, hai bàn tay đã đông cứng tím tái vì giá rét nhưng đôi mắt vẫn sáng quắc tựa như tinh tú giữa trời đông.

Đã ba ngày ba đêm trôi qua, một giọt nước chưa thấm giọng, một hạt cơm chưa vào bụng. Lời mỉa mai khinh khi của các đệ tử ngoại môn văng vẳng bên tai: "Một kẻ phàm căn tạp mạch, đan điền bế tắc như bùn lầy phế phẩm, cũng mơ mộng bước vào tiên đồ cầu trường sinh hay sao?" Thế nhưng trong lồng ngực hắn, một ngọn lửa bất khuất chưa từng một khắc lụi tàn.

— "Nếu đạo trời bất công giáng ta làm phàm nhân cỏ rác, ta liền dùng chính ý chí này nghịch chuyển càn khôn!" — Hắn cắn chặt răng, từng giọt máu tươi rỉ ra từ khóe môi thấm đỏ thấu qua lớp tuyết trắng dưới chân.

Đúng vào lúc sinh mệnh dường như cạn kiệt, một luồng khí tức ấm áp kỳ lạ từ mảnh ngọc bội gia truyền giấu kín trước ngực bỗng nhiên bừng phát. Khí tức màu tử kim mỏng manh như sợi tơ nhưng mang theo uy nghiêm viễn cổ thượng thừa lập tức len lỏi qua từng thớ thịt, tràn thẳng vào khí hải đan điền đã ngủ vùi suốt mười tám năm ròng. Tiếng sấm rền trầm đục vang vọng trong thức hải, phong ấn vô hình rạn vỡ, mười hai đường kinh mạch chính đồng loạt thông suốt!

Linh khí thiên địa ngàn dặm xung quanh bỗng nhiên cuồng bạo sôi trào, tạo thành một lốc xoáy ngũ sắc khổng lồ rọi sáng cả màn đêm tuyết phủ. Bên trong đại điện Thái Sơ, chuông đồng cảnh báo ngân vang dồn dập, các vị trưởng lão bế quan trăm năm đồng loạt giật mình mở mắt, kinh hãi nhìn về hướng sơn môn. Một thời đại mới của ${t} chính thức bắt đầu từ đêm tuyết định mệnh này.`;
  }

  if (g === 'kiem-hiep') {
    return `${intro ? intro + '\n\n' : ''}Khói hoàng hôn lãng đãng buông xuống dòng Lạc Thủy, sắc trời ngả sang màu tím thẫm như một dải lụa thêu dở dang vắt ngang triền núi xa. Gió thu lạnh buốt cuốn theo những chiếc lá phong đỏ úa xoay tít trên mặt đường đá gập ghềnh. Nơi tửu quán ven đường bên gốc liễu già, tiếng đao kiếm va chạm lanh lảnh hòa cùng tiếng gầm thét dữ dội của đám giang hồ hảo hán xé toạc bầu không khí tĩnh mịch của buổi chiều tà.

Bên chiếc bàn gỗ góc quán, một nam tử vận thanh y thô sơ chậm rãi nâng chén rượu nhạt lên môi. Chiếc nón trúc sụp xuống che khuất nửa khuôn mặt phong trần sương gió, chỉ để lộ đường quai hàm cương nghị và thanh trường kiếm bọc vải bố đặt ngang trên gối. Mười năm phiêu bạt chốn giang hồ đầy rẫy mưa tanh gió máu, hắn đã từng chứng kiến biết bao màn phản trắc, bao nhiêu hào kiệt hôm nay còn nâng chén kết nghĩa huynh đệ, ngày mai đã rút đao tương tàn vì một bức tàn đồ bí kíp võ công.

— "Bắt lấy hắn! Các chủ có lệnh, ai lấy được đầu kẻ phản đồ môn phái sẽ được thưởng vạn lượng hoàng kim, truyền thụ tuyệt kỹ trấn phái!" — Tiếng thét the thé của gã thủ lĩnh áo đen mang theo kình phong xé gió, lưỡi quỷ đầu đao nặng hơn ba mươi cân bổ thẳng xuống đầu nam tử.

Không một tia nao núng, cánh tay thanh y khẽ chấn động. "Keng!" — một tiếng ngân thanh thúy vang lên tựa như rồng ngâm giữa đêm thanh vắng. Kiếm quang màu lam nhạt lóe lên như lằn chớp giữa trời quang, đường kiếm không hề hoa mỹ phức tạp nhưng tốc độ đạt tới cảnh giới đăng phong tạo cực. Trong chớp mắt, mũi đao của tên sát thủ gãy vụn thành ba khúc, dư kình kiếm phong quét qua hất tung năm tên đồng bọn lùi lại hơn mười trượng, ngực áo rách toạc một đường tơ máu mỏng manh.

— "Về nói với các chủ của các ngươi, ân oán năm xưa trên đỉnh Nhạn Đãng Sơn, ${a} này nhất định sẽ đòi lại đủ cả vốn lẫn lời!" — Dứt lời, bóng người thanh y lướt nhẹ như chiếc lá cuốn theo chiều gió, phiêu dật bước vào màn đêm mịt mùng, để lại phía sau những tiếng rên rỉ kinh hoàng của lũ lâu la bại trận.`;
  }

  if (g === 'do-thi') {
    return `${intro ? intro + '\n\n' : ''}Cơn mưa rào bất chợt của buổi xế chiều trút xuống như thác đổ, gột rửa đi lớp bụi bặm ngột ngạt của thành phố triệu dân. Dòng xe cộ trên đại lộ Nguyễn Huệ bắt đầu kẹt cứng, những ánh đèn pha đỏ rực nối dài như một dải ngân hà bất tận giữa lòng đô hội. Đứng bên khung cửa kính tầng bốn mươi hai của tòa nhà trung tâm tài chính, nhìn xuống dòng người hối hả ngược xuôi, trong lòng người đàn ông không khỏi dâng lên những xúc cảm bùi ngùi.

Mười năm trước, khi vừa tốt nghiệp đại học với tấm bằng loại giỏi và hành trang vỏn vẹn hai bàn tay trắng cùng một chiếc xe máy cà tàng, anh đã từng phải trải qua những ngày tháng ăn bánh mì không cầm hơi, lang thang khắp các con hẻm nhỏ xin từng cơ hội phỏng vấn. Đã có những lúc tuyệt vọng tưởng chừng phải bỏ cuộc để quay về quê làm một công việc bình lặng, nhưng ngọn lửa khát vọng vươn lên thay đổi số phận chưa bao giờ thôi thôi thúc trong lồng ngực.

— "Thương trường như chiến trường, một khi đã bước chân vào cuộc chơi thì chỉ có sự kiên định, đạo đức nghề nghiệp và bản lĩnh vượt khó mới giúp mình trụ vững." — Lời dặn dò chân tình của người cha trước lúc đi xa luôn là điểm tựa tinh thần vững chắc nhất cho anh giữa muôn trùng sóng gió cám dỗ chốn phù hoa.

Đột nhiên, cánh cửa phòng làm việc bật mở, trợ lý vội vã bước vào với tập hồ sơ thẩm định trên tay, giọng nói không giấu nổi sự phấn chấn: "Thưa giám đốc, đối tác quốc tế vừa chính thức ký kết thỏa thuận đầu tư chiến lược cho dự án công nghệ xanh của chúng ta! Họ đánh giá phương án bảo vệ môi trường và giải pháp y tế cộng đồng của tập đoàn đạt tiêu chuẩn xuất sắc nhất khu vực Đông Nam Á!"

Anh khẽ mỉm cười, ánh mắt nhìn xa xăm qua màn mưa trắng xóa. Đây không phải điểm đích cuối cùng, mà là một nấc thang mới để biến những ước mơ nhân văn phục vụ xã hội thành hiện thực trọn vẹn trong hành trình của ${t}.`;
  }

  if (g === 'khoa-huyen') {
    return `${intro ? intro + '\n\n' : ''}Vực thẳm không gian vô tận trải dài trước mắt trạm nghiên cứu Vọng Thiên như một tấm nhung đen tuyền nạm hàng tỷ viên kim cương lấp lánh. Không gian chân không tuyệt đối không một tiếng động, chỉ có những nhịp thở đều đặn qua bộ đồ bảo hộ sinh học và tiếng rè rè trầm thấp của hệ thống tuần hoàn dưỡng khí lượng tử. Dưới bụng phi thuyền viễn chinh, tinh cầu mẹ Trái Đất hiện lên như một hòn ngọc bích lơ lửng giữa biển sao bao la.

Bên trong buồng chỉ huy trọng lực nhân tạo, các chuyên gia khoa học hàng đầu đang nín thở theo dõi sự dịch chuyển bất thường của cụm tinh vân dị biến. Trên màn hình toàn ảnh không gian ba chiều, biểu đồ năng lượng phản vật chất liên tục nhảy vọt qua ngưỡng đỏ báo động. Hệ thống trí tuệ nhân tạo trung tâm NOVA phát ra cảnh báo dồn dập: "Cảnh báo khẩn cấp cấp độ Alpha: Phát hiện tín hiệu sóng hạ âm có cấu trúc logic thông minh phát ra từ tâm chấn hố đen nhân tạo, khoảng cách ba mươi đơn vị thiên văn."

— "Kích hoạt toàn bộ lá chắn hạt photon và chuẩn bị động cơ bước nhảy siêu không gian! Thu thập toàn bộ dữ liệu quang phổ để truyền về trung tâm điều khiển mặt đất ngay lập tức!" — Thuyền trưởng Minh Quân ra lệnh với giọng điệu trầm tĩnh nhưng đanh thép của một người lính dày dạn trận mạc.

Đột nhiên, một chùm tia bức xạ màu lam ngọc rực rỡ xuyên qua lớp bụi khí vũ trụ, chiếu thẳng vào mạn phải của phi thuyền. Những ký tự mã hóa đa chiều phức tạp chưa từng xuất hiện trong bất kỳ ngôn ngữ nào của loài người bắt đầu hiển thị trên bảng điều khiển giao tiếp, tựa như một thông điệp cổ xưa được gửi gắm qua hàng triệu năm ánh sáng từ một nền văn minh đã biến mất trước khi loài người xuất hiện.

Khoảnh khắc lịch sử ấy khiến tất cả thành viên phi hành đoàn sững sờ. Họ hiểu rằng, cánh cửa mở ra bí mật nguồn gốc của vũ trụ và tương lai sinh tồn của toàn thể nhân loại trong vũ trụ ${t} vừa mới hé mở...`;
  }

  if (g === 'huyen-huyen') {
    return `${intro ? intro + '\n\n' : ''}Ánh trăng máu đỏ quạch treo lơ lửng trên bầu trời hoang tàn của đại lục Aethelgard, phủ lên những cánh rừng cổ thụ ngàn năm một sắc màu ma mị rợn người. Gió đêm thốc từng cơn mang theo mùi lưu huỳnh khét lẹt từ phía ngọn núi lửa Hắc Diễm vọng lại, báo hiệu thời khắc phong ấn thượng cổ suy yếu nhất trong chu kỳ một ngàn năm.

Đứng trên vách đá tai mèo dựng đứng của hẻm núi Ma Quỷ, thiếu niên khoác áo choàng rách rưới siết chặt chuôi thanh cự kiếm rỉ sét. Dưới lớp vải băng quấn chặt nơi cánh tay phải, những đường vân ma pháp hình vảy rồng đang phát ra ánh sáng tử kim chói lòa, bỏng rát như có dòng nham thạch đang cuộn chảy trong huyết quản. Mười năm nay, hắn bị cả gia tộc ruồng bỏ, bị xem như một kẻ mang huyết mạch nguyền rủa của ma quỷ, nhưng không ai biết rằng đó chính là phong ấn thức tỉnh của Cự Long viễn cổ.

— "Gào thét đi, hỡi lũ sinh vật bóng đêm ti tiện! Hôm nay, huyết mạch Thần Đế sẽ dùng máu của các ngươi để tế lễ ngày phục sinh!" — Tiếng thét vang dội như sấm sét xé toạc màn đêm u tối.

Hàng ngàn con ma lang mắt đỏ khổng lồ gầm rú lao lên từ lòng vực sâu, nanh vuốt sắc nhọn lấp loáng dưới ánh trăng máu. Không một bước lùi, thiếu niên vung thanh đại kiếm lên không trung, chú ngữ cấm kỵ viễn cổ tuôn trào theo từng nhịp đập của trái tim. Một cột lửa màu lam tím khổng lồ bốc cao nghìn trượng, hóa thành hư ảnh một đầu thái cổ cự long giương vuốt rít gào, thiêu rụi toàn bộ bầy quái vật chỉ trong một hơi thở.

Bụi tro tan biến, ánh sáng thần khí tỏa chiếu rực rỡ cả một góc trời. Đứng giữa đống tàn tích rực lửa, ánh mắt thiếu niên đã không còn nét ngây thơ non nớt, mà toát lên uy nghiêm của một bậc chí tôn sắp sửa bước lên vương tọa thần thánh trong huyền thoại ${t}.`;
  }

  // Mặc định: Trinh thám
  return `${intro ? intro + '\n\n' : ''}Màn mưa phùn giăng kín Cố đô suốt ba ngày đêm liền khiến những con hẻm cổ kính rêu phong càng thêm vẻ thâm u tịch mịch. Tiếng chuông chùa Thiên Mụ từng hồi ngân nga trầm buồn buông vào thinh không, hòa lẫn với tiếng nước sông Hương ì oạp vỗ vào bờ đá hoa cương. Phía trước ngôi nhà rường ba gian cổ kính ở xóm Kim Long, những dải băng vàng phong tỏa hiện trường của lực lượng công an rũ rượi dưới làn mưa lạnh buốt.

Nạn nhân là một vị giáo sư cổ học uyên bác ngoài bảy mươi tuổi, chuyên gia hàng đầu về giải mã văn bia và đồ cổ triều Nguyễn. Thi thể ông được phát hiện trong tư thế ngồi ngay ngắn trên chiếc ghế bành bằng gỗ mun đối diện bàn trà, đôi mắt mở trừng trừng nhìn vào bức thư pháp cổ treo trên tường, trên môi còn đọng lại một vệt bọt mép tím tái kỳ lạ. Kỳ lạ nhất là trên bàn trà chỉ có duy nhất một chén sứ hoa lam chứa thứ trà thơm thoang thoảng mùi hoa mai rừng, hoàn toàn không có dấu vết của sự giằng co hay xô xát.

— "Báo cáo đại úy Nam, kết quả giám định pháp y bước đầu xác nhận nạn nhân tử vong do chất độc cực mạnh chiết xuất từ loài nấm kịch độc vùng rừng rậm A Lưới. Thời gian tử vong ước tính vào khoảng canh ba đêm qua, chính xác là lúc cơn dông đầu mùa ập tới." — Người chiến sĩ kỹ thuật hình sự thận trọng báo cáo.

Đại úy Nam lặng lẽ bước tới bên chiếc bàn làm việc, ánh mắt sắc sảo đảo quanh từng cuốn sách cổ gáy da bạc màu. Bằng kinh nghiệm phá án dày dạn suốt hai mươi năm trong lực lượng trọng án, anh nhận ra chiếc chặn giấy bằng ngọc bích quý giá thường ngày của nạn nhân đã biến mất, thay vào đó là một mẩu giấy bản nhỏ kẹp dưới đáy ấm trà, trên đó vẽ một ký hiệu hoa mai năm cánh với dòng mật mã bí ẩn viết bằng mực tàu: "Kẻ giấu mặt trong gương đã lấy lại thứ thuộc về hoàng tộc..."

Tiếng sấm rền vang rạch ngang bầu trời đêm làm rung chuyển cả mái ngói rêu phong. Cuộc đấu trí căng thẳng đến nghẹt thở giữa công lý và tội ác tinh vi bắt đầu mở màn trong vụ án kinh thiên động địa mang tên ${t}.`;
}

export function generateAll50NovelsDeepData(): SeedNovel[] {
  const result: SeedNovel[] = [];

  for (const novel of SEED_50_NOVELS) {
    const updatedChapters = novel.chapters.map((ch) => {
      const deepContent = buildDeepChapterContent(novel, ch.num, ch.title, ch.content);
      return {
        num: ch.num,
        title: ch.title,
        content: deepContent,
      };
    });

    result.push({
      ...novel,
      chapters: updatedChapters,
    });
  }

  return result;
}

// Ghi đè vào server/data/seed-novels.ts
const allDeepNovels = generateAll50NovelsDeepData();
const targetPath = path.resolve('E:/CwAI/CwAI_Story/server/data/seed-novels.ts');

const fileHeader = `export interface SeedNovel {
  title: string;
  slug: string;
  author: string;
  genreSlug: string;
  cover: string;
  description: string;
  chapters: { num: number; title: string; content: string }[];
}

export const SEED_50_NOVELS: SeedNovel[] = `;

fs.writeFileSync(targetPath, fileHeader + JSON.stringify(allDeepNovels, null, 2) + ';\n', 'utf-8');
console.log(`Đã tạo thành công dữ liệu trường thiên hoàn chỉnh cho ${allDeepNovels.length} bộ truyện!`);
