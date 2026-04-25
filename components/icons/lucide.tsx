'use client';

import {
  Alert01Icon,
  AlertCircleIcon,
  ArchiveIcon,
  ArrowDown01Icon,
  ArrowDownAZIcon,
  ArrowDownLeft01Icon,
  ArrowLeft01Icon,
  ArrowLeftRightIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowTurnBackwardIcon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  ArrowUpRight03Icon,
  AttachmentIcon,
  Award02Icon,
  BalanceScaleIcon,
  BitcoinEllipseIcon,
  BookOpen01Icon,
  Bookmark01Icon,
  BrainCogIcon,
  Building01Icon,
  Calendar03Icon,
  Call02Icon,
  Camera01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkBadge02Icon,
  CheckmarkCircle02Icon,
  CheckmarkCircle03Icon,
  CheckmarkSquare02Icon,
  ClipboardIcon,
  ClipboardPasteIcon,
  Clock01Icon,
  CloudUploadIcon,
  CodeIcon,
  CompassIcon,
  ContactIcon,
  Copy01Icon,
  CpuIcon,
  CrownIcon,
  Delete02Icon,
  DollarCircleIcon,
  Download01Icon,
  DragDropVerticalIcon,
  DropletIcon,
  FavouriteIcon,
  File02Icon,
  Film01Icon,
  FilterIcon,
  GamepadDirectionalIcon,
  GiftIcon,
  GlobeIcon,
  HashtagIcon,
  HelpCircleIcon,
  EyeIcon as HugeEyeIcon,
  Image01Icon,
  InboxIcon,
  InformationCircleIcon,
  InstagramIcon,
  Key02Icon,
  LanguageCircleIcon,
  LayoutGridIcon,
  Link01Icon,
  Linkedin01Icon,
  ListViewIcon,
  LoaderPinwheelIcon,
  LockIcon,
  Logout02Icon,
  Mail01Icon,
  MailAtSign01Icon,
  MapPinHouseIcon,
  MapPinIcon,
  Menu02Icon,
  Message01Icon,
  MessageAdd01Icon,
  MessageCircleReplyIcon,
  MessageMultiple01Icon,
  MessagePreview01Icon,
  MessageSquareDashedIcon,
  MinusSignIcon,
  MoreHorizontalIcon,
  MusicNote01Icon,
  PartyIcon,
  PencilEdit01Icon,
  PencilEdit02Icon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusSignIcon,
  QrCodeIcon,
  RefreshIcon,
  Rocket01Icon,
  RotateLeft01Icon,
  ScanIcon,
  Search01Icon,
  SendingOrderIcon,
  Settings01Icon,
  Settings03Icon,
  Share01Icon,
  Share02Icon,
  Shield01Icon,
  ShieldBanIcon,
  ShieldQuestionMarkIcon,
  ShoppingCart02Icon,
  SmileIcon,
  SparklesIcon,
  SquareIcon,
  StarIcon,
  Sun01Icon,
  TerminalIcon,
  TextBoldIcon,
  TextIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  ThermometerIcon,
  Ticket01Icon,
  TimeScheduleIcon,
  TurtleNeckIcon,
  TwitterIcon,
  Unlink01Icon,
  Upload01Icon,
  UserAdd01Icon,
  UserCheck01Icon,
  UserCircleIcon,
  UserEdit01Icon,
  UserGroupIcon,
  UserIcon,
  UserMinus01Icon,
  ViewOffIcon,
  Wallet01Icon,
  WindPowerIcon,
  YoutubeIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type HugeiconsProps, type IconSvgElement } from '@hugeicons/react';
import type { LucideIcon as BaseLucideIcon, LucideProps } from 'lucide-react';
import * as React from 'react';

type HugeLucideProps = Omit<HugeiconsProps, 'icon' | 'ref' | 'strokeWidth'> &
  Pick<LucideProps, 'strokeWidth'>;
export type LucideIcon = BaseLucideIcon;

function createIcon(icon: IconSvgElement, displayName: string): LucideIcon {
  const Component = React.forwardRef<SVGSVGElement, HugeLucideProps>(
    ({ size = 24, strokeWidth = 1.5, ...props }, ref) => {
      const resolvedStrokeWidth =
        typeof strokeWidth === 'string' ? Number.parseFloat(strokeWidth) : strokeWidth;

      return (
        <HugeiconsIcon
          ref={ref}
          icon={icon}
          size={size}
          strokeWidth={Number.isFinite(resolvedStrokeWidth) ? resolvedStrokeWidth : 1.5}
          {...props}
        />
      );
    }
  );

  Component.displayName = displayName;

  return Component as unknown as LucideIcon;
}

const AlertCircleBase = createIcon(AlertCircleIcon, 'AlertCircle');
const AlertTriangleBase = createIcon(Alert01Icon, 'AlertTriangle');
const ArchiveBase = createIcon(ArchiveIcon, 'Archive');
const ArrowDownBase = createIcon(ArrowDown01Icon, 'ArrowDown');
const ArrowDownAZBase = createIcon(ArrowDownAZIcon, 'ArrowDownAZ');
const ArrowDownLeftBase = createIcon(ArrowDownLeft01Icon, 'ArrowDownLeft');
const ArrowLeftBase = createIcon(ArrowLeft01Icon, 'ArrowLeft');
const ArrowRightBase = createIcon(ArrowRight01Icon, 'ArrowRight');
const ArrowRightLeftBase = createIcon(ArrowLeftRightIcon, 'ArrowRightLeft');
const ArrowUpBase = createIcon(ArrowUp01Icon, 'ArrowUp');
const ArrowUpDownBase = createIcon(ArrowUpDownIcon, 'ArrowUpDown');
const ArrowUpRightBase = createIcon(ArrowUpRight01Icon, 'ArrowUpRight');
const AtSignBase = createIcon(MailAtSign01Icon, 'AtSign');
const AwardBase = createIcon(Award02Icon, 'Award');
const BadgeCheckBase = createIcon(CheckmarkBadge02Icon, 'BadgeCheck');
const BitcoinBase = createIcon(BitcoinEllipseIcon, 'Bitcoin');
const BoldBase = createIcon(TextBoldIcon, 'Bold');
const BookOpenBase = createIcon(BookOpen01Icon, 'BookOpen');
const BookmarkBase = createIcon(Bookmark01Icon, 'Bookmark');
const BrainCircuitBase = createIcon(BrainCogIcon, 'BrainCircuit');
const BuildingBase = createIcon(Building01Icon, 'Building');
const CalendarBase = createIcon(Calendar03Icon, 'Calendar');
const CalendarClockBase = createIcon(TimeScheduleIcon, 'CalendarClock');
const CameraBase = createIcon(Camera01Icon, 'Camera');
const CheckBase = createIcon(CheckmarkCircle02Icon, 'Check');
const CheckCheckBase = createIcon(CheckmarkBadge02Icon, 'CheckCheck');
const CheckCircleBase = createIcon(CheckmarkCircle02Icon, 'CheckCircle');
const CheckCircle2Base = createIcon(CheckmarkCircle03Icon, 'CheckCircle2');
const CheckSquareBase = createIcon(CheckmarkSquare02Icon, 'CheckSquare');
const ChevronDownBase = createIcon(ArrowDown01Icon, 'ChevronDown');
const ChevronLeftBase = createIcon(ArrowLeft01Icon, 'ChevronLeftIcon');
const ChevronRightBase = createIcon(ArrowRight01Icon, 'ChevronRight');
const ChevronsRightBase = createIcon(ArrowRightDoubleIcon, 'ChevronsRight');
const CircleHelpBase = createIcon(HelpCircleIcon, 'CircleHelp');
const ClapperboardBase = createIcon(Film01Icon, 'Clapperboard');
const ClipboardListBase = createIcon(ClipboardIcon, 'ClipboardList');
const ClipboardPasteBase = createIcon(ClipboardPasteIcon, 'ClipboardPaste');
const ClockBase = createIcon(Clock01Icon, 'Clock');
const CodeBase = createIcon(CodeIcon, 'Code');
const CompassBase = createIcon(CompassIcon, 'Compass');
const ContactBase = createIcon(ContactIcon, 'Contact');
const CopyBase = createIcon(Copy01Icon, 'Copy');
const CornerDownLeftBase = createIcon(ArrowTurnBackwardIcon, 'CornerDownLeft');
const CpuBase = createIcon(CpuIcon, 'Cpu');
const CrownBase = createIcon(CrownIcon, 'Crown');
const DeleteBase = createIcon(Delete02Icon, 'Delete');
const DollarSignBase = createIcon(DollarCircleIcon, 'DollarSign');
const DownloadBase = createIcon(Download01Icon, 'Download');
const DropletsBase = createIcon(DropletIcon, 'Droplets');
const Edit2Base = createIcon(PencilEdit01Icon, 'Edit2');
const Edit3Base = createIcon(PencilEdit02Icon, 'Edit3');
const ExternalLinkBase = createIcon(ArrowUpRight03Icon, 'ExternalLink');
const EyeBase = createIcon(HugeEyeIcon, 'Eye');
const EyeOffBase = createIcon(ViewOffIcon, 'EyeOff');
const FileBase = createIcon(File02Icon, 'FileIcon');
const FileTextBase = createIcon(File02Icon, 'FileText');
const FilterBase = createIcon(FilterIcon, 'Filter');
const Gamepad2Base = createIcon(GamepadDirectionalIcon, 'Gamepad2');
const GiftBase = createIcon(GiftIcon, 'Gift');
const GlobeBase = createIcon(GlobeIcon, 'Globe');
const GripVerticalBase = createIcon(DragDropVerticalIcon, 'GripVertical');
const HashBase = createIcon(HashtagIcon, 'Hash');
const HeartBase = createIcon(FavouriteIcon, 'Heart');
const HelpCircleBase = createIcon(HelpCircleIcon, 'HelpCircle');
const ImageBase = createIcon(Image01Icon, 'Image');
const InboxBase = createIcon(InboxIcon, 'Inbox');
const InfoBase = createIcon(InformationCircleIcon, 'Info');
const InstagramBase = createIcon(InstagramIcon, 'Instagram');
const ItalicBase = createIcon(TextItalicIcon, 'Italic');
const KeyBase = createIcon(Key02Icon, 'Key');
const KeyRoundBase = createIcon(Key02Icon, 'KeyRound');
const LanguagesBase = createIcon(LanguageCircleIcon, 'Languages');
const LayoutGridBase = createIcon(LayoutGridIcon, 'LayoutGrid');
const LayoutListBase = createIcon(ListViewIcon, 'LayoutList');
const LinkBase = createIcon(Link01Icon, 'Link');
const LinkedinBase = createIcon(Linkedin01Icon, 'Linkedin');
const ListBase = createIcon(ListViewIcon, 'List');
const LoaderBase = createIcon(LoaderPinwheelIcon, 'Loader');
const LockBase = createIcon(LockIcon, 'Lock');
const LogOutBase = createIcon(Logout02Icon, 'LogOut');
const MailBase = createIcon(Mail01Icon, 'Mail');
const MapPinBase = createIcon(MapPinIcon, 'MapPin');
const MapPinHouseBase = createIcon(MapPinHouseIcon, 'MapPinHouse');
const MenuBase = createIcon(Menu02Icon, 'Menu');
const MessageCircleBase = createIcon(Message01Icon, 'MessageCircle');
const MessageSquareBase = createIcon(MessageSquareDashedIcon, 'MessageSquare');
const MessageSquarePlusBase = createIcon(MessageAdd01Icon, 'MessageSquarePlus');
const MessageSquareTextBase = createIcon(MessagePreview01Icon, 'MessageSquareText');
const MessagesSquareBase = createIcon(MessageMultiple01Icon, 'MessagesSquare');
const MinusBase = createIcon(MinusSignIcon, 'Minus');
const MoreHorizontalBase = createIcon(MoreHorizontalIcon, 'MoreHorizontal');
const MusicBase = createIcon(MusicNote01Icon, 'Music');
const PaperclipBase = createIcon(AttachmentIcon, 'Paperclip');
const PartyPopperBase = createIcon(PartyIcon, 'PartyPopper');
const PencilBase = createIcon(PencilIcon, 'Pencil');
const PhoneBase = createIcon(Call02Icon, 'Phone');
const PinBase = createIcon(PinIcon, 'Pin');
const PinOffBase = createIcon(PinOffIcon, 'PinOff');
const PlusBase = createIcon(PlusSignIcon, 'Plus');
const QrCodeBase = createIcon(QrCodeIcon, 'QrCode');
const RefreshCwBase = createIcon(RefreshIcon, 'RefreshCw');
const ReplyBase = createIcon(MessageCircleReplyIcon, 'Reply');
const RocketBase = createIcon(Rocket01Icon, 'Rocket');
const RotateCcwBase = createIcon(RotateLeft01Icon, 'RotateCcw');
const ScaleBase = createIcon(BalanceScaleIcon, 'Scale');
const ScanBase = createIcon(ScanIcon, 'Scan');
const SearchBase = createIcon(Search01Icon, 'Search');
const SendBase = createIcon(SendingOrderIcon, 'Send');
const SendHorizontalBase = createIcon(SendingOrderIcon, 'SendHorizontal');
const SettingsBase = createIcon(Settings01Icon, 'Settings');
const Settings2Base = createIcon(Settings03Icon, 'Settings2');
const ShareBase = createIcon(Share01Icon, 'Share');
const Share2Base = createIcon(Share02Icon, 'Share2');
const ShieldBase = createIcon(Shield01Icon, 'Shield');
const ShieldAlertBase = createIcon(ShieldQuestionMarkIcon, 'ShieldAlert');
const ShieldCheckBase = createIcon(Shield01Icon, 'ShieldCheck');
const ShieldOffBase = createIcon(ShieldBanIcon, 'ShieldOff');
const ShoppingCartBase = createIcon(ShoppingCart02Icon, 'ShoppingCart');
const SmileBase = createIcon(SmileIcon, 'Smile');
const SparklesBase = createIcon(SparklesIcon, 'Sparkles');
const SquareBase = createIcon(SquareIcon, 'Square');
const StarBase = createIcon(StarIcon, 'Star');
const StrikethroughBase = createIcon(TextStrikethroughIcon, 'Strikethrough');
const SunBase = createIcon(Sun01Icon, 'Sun');
const TerminalBase = createIcon(TerminalIcon, 'Terminal');
const ThermometerBase = createIcon(ThermometerIcon, 'Thermometer');
const TicketBase = createIcon(Ticket01Icon, 'Ticket');
const Trash2Base = createIcon(Delete02Icon, 'Trash2');
const TriangleAlertBase = createIcon(Alert01Icon, 'TriangleAlert');
const TurtleBase = createIcon(TurtleNeckIcon, 'Turtle');
const TwitterBase = createIcon(TwitterIcon, 'Twitter');
const TypeBase = createIcon(TextIcon, 'Type');
const UnlinkBase = createIcon(Unlink01Icon, 'Unlink');
const UploadBase = createIcon(Upload01Icon, 'Upload');
const UploadCloudBase = createIcon(CloudUploadIcon, 'UploadCloud');
const UserBase = createIcon(UserIcon, 'User');
const UserCheckBase = createIcon(UserCheck01Icon, 'UserCheck');
const UserCircleBase = createIcon(UserCircleIcon, 'UserCircle');
const UserMinusBase = createIcon(UserMinus01Icon, 'UserMinus');
const UserPlusBase = createIcon(UserAdd01Icon, 'UserPlus');
const UserRoundPenBase = createIcon(UserEdit01Icon, 'UserRoundPen');
const UsersBase = createIcon(UserGroupIcon, 'Users');
const WalletBase = createIcon(Wallet01Icon, 'Wallet');
const WindBase = createIcon(WindPowerIcon, 'Wind');
const XBase = createIcon(Cancel01Icon, 'X');
const XCircleBase = createIcon(CancelCircleIcon, 'XCircle');
const YoutubeBase = createIcon(YoutubeIcon, 'Youtube');
const ZapBase = createIcon(BitcoinEllipseIcon, 'Zap');

export const AlertCircle = AlertCircleBase;
export const AlertTriangle = AlertTriangleBase;
export const Archive = ArchiveBase;
export const ArrowDown = ArrowDownBase;
export const ArrowDownAZ = ArrowDownAZBase;
export const ArrowDownLeft = ArrowDownLeftBase;
export const ArrowLeft = ArrowLeftBase;
export const ArrowRight = ArrowRightBase;
export const ArrowRightLeft = ArrowRightLeftBase;
export const ArrowUp = ArrowUpBase;
export const ArrowUpDown = ArrowUpDownBase;
export const ArrowUpRight = ArrowUpRightBase;
export const AtSign = AtSignBase;
export const AtSignIcon = AtSignBase;
export const Award = AwardBase;
export const BadgeCheck = BadgeCheckBase;
export const Bitcoin = BitcoinBase;
export const Bold = BoldBase;
export const BookOpen = BookOpenBase;
export const Bookmark = BookmarkBase;
export const BrainCircuit = BrainCircuitBase;
export const Building = BuildingBase;
export const Calendar = CalendarBase;
export const Calendar1 = CalendarBase;
export const CalendarClock = CalendarClockBase;
export const Camera = CameraBase;
export const Check = CheckBase;
export const CheckCheck = CheckCheckBase;
export const CheckCircle = CheckCircleBase;
export const CheckCircle2 = CheckCircle2Base;
export const CheckSquare = CheckSquareBase;
export const ChevronDown = ChevronDownBase;
export const ChevronLeft = ChevronLeftBase;
export const ChevronLeftIcon = ChevronLeftBase;
export const ChevronRight = ChevronRightBase;
export const ChevronRightIcon = ChevronRightBase;
export const ChevronsRight = ChevronsRightBase;
export const CircleHelp = CircleHelpBase;
export const Clapperboard = ClapperboardBase;
export const ClipboardList = ClipboardListBase;
export const ClipboardPaste = ClipboardPasteBase;
export const Clock = ClockBase;
export const Code = CodeBase;
export const Compass = CompassBase;
export const Contact = ContactBase;
export const Copy = CopyBase;
export const CornerDownLeft = CornerDownLeftBase;
export const Cpu = CpuBase;
export const Crown = CrownBase;
export const Delete = DeleteBase;
export const DollarSign = DollarSignBase;
export const Download = DownloadBase;
export const Droplets = DropletsBase;
export const Edit2 = Edit2Base;
export const Edit3 = Edit3Base;
export const ExternalLink = ExternalLinkBase;
export const Eye = EyeBase;
export const EyeIcon = EyeBase;
export const EyeOff = EyeOffBase;
export const FileIcon = FileBase;
export const FileText = FileTextBase;
export const Filter = FilterBase;
export const Gamepad2 = Gamepad2Base;
export const Gift = GiftBase;
export const Globe = GlobeBase;
export const GripVertical = GripVerticalBase;
export const Hash = HashBase;
export const Heart = HeartBase;
export const HelpCircle = HelpCircleBase;
export const Image = ImageBase;
export const Inbox = InboxBase;
export const Info = InfoBase;
export const Instagram = InstagramBase;
export const Italic = ItalicBase;
export const Key = KeyBase;
export const KeyRound = KeyRoundBase;
export const Languages = LanguagesBase;
export const LayoutGrid = LayoutGridBase;
export const LayoutList = LayoutListBase;
export const Link = LinkBase;
export const Linkedin = LinkedinBase;
export const List = ListBase;
export const Loader = LoaderBase;
export const Loader2 = LoaderBase;
export const Lock = LockBase;
export const LogOut = LogOutBase;
export const Mail = MailBase;
export const MailIcon = MailBase;
export const MapPin = MapPinBase;
export const MapPinHouse = MapPinHouseBase;
export const Menu = MenuBase;
export const MessageCircle = MessageCircleBase;
export const MessageSquare = MessageSquareBase;
export const MessageSquarePlus = MessageSquarePlusBase;
export const MessageSquareText = MessageSquareTextBase;
export const MessagesSquare = MessagesSquareBase;
export const Minus = MinusBase;
export const MoreHorizontal = MoreHorizontalBase;
export const Music = MusicBase;
export const Paperclip = PaperclipBase;
export const PartyPopper = PartyPopperBase;
export const Pencil = PencilBase;
export const Phone = PhoneBase;
export const Pin = PinBase;
export const PinOff = PinOffBase;
export const Plus = PlusBase;
export const PlusIcon = PlusBase;
export const QrCode = QrCodeBase;
export const RefreshCw = RefreshCwBase;
export const Reply = ReplyBase;
export const Rocket = RocketBase;
export const RotateCcw = RotateCcwBase;
export const Scale = ScaleBase;
export const Scan = ScanBase;
export const Search = SearchBase;
export const Send = SendBase;
export const SendHorizontal = SendHorizontalBase;
export const Settings = SettingsBase;
export const Settings2 = Settings2Base;
export const Share = ShareBase;
export const Share2 = Share2Base;
export const Shield = ShieldBase;
export const ShieldAlert = ShieldAlertBase;
export const ShieldCheck = ShieldCheckBase;
export const ShieldOff = ShieldOffBase;
export const ShoppingCart = ShoppingCartBase;
export const Smile = SmileBase;
export const Sparkles = SparklesBase;
export const Square = SquareBase;
export const Star = StarBase;
export const Strikethrough = StrikethroughBase;
export const Sun = SunBase;
export const Terminal = TerminalBase;
export const Thermometer = ThermometerBase;
export const Ticket = TicketBase;
export const Trash2 = Trash2Base;
export const TriangleAlert = TriangleAlertBase;
export const Turtle = TurtleBase;
export const Twitter = TwitterBase;
export const Type = TypeBase;
export const Unlink = UnlinkBase;
export const Upload = UploadBase;
export const UploadCloud = UploadCloudBase;
export const User = UserBase;
export const UserCheck = UserCheckBase;
export const UserCircle = UserCircleBase;
export const UserMinus = UserMinusBase;
export const UserPlus = UserPlusBase;
export const UserRoundPen = UserRoundPenBase;
export const Users = UsersBase;
export const Wallet = WalletBase;
export const Wind = WindBase;
export const X = XBase;
export const XCircle = XCircleBase;
export const XIcon = XBase;
export const Youtube = YoutubeBase;
export const Zap = ZapBase;
